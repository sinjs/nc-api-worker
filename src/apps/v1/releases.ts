import { Hono } from 'hono';
import { Bindings, HonoEnv } from '../../util.js';
import { z } from 'zod';
import { Octokit } from 'octokit';

const assetTypeEnum = z.enum(['windows-gui', 'windows-cli', 'macos-gui', 'linux-cli']);

type Release = Awaited<ReturnType<HonoEnv['Variables']['octokit']['rest']['repos']['getLatestRelease']>>['data'];
type AssetType = z.infer<typeof assetTypeEnum>;
type Project = { owner: string; repo: string };

type ReleasesEnv = {
	Variables: {
		project: Project;
	};
};

const parseAssetType = (name: string): AssetType | null => {
	switch (name) {
		case 'VencordInstaller.exe':
			return 'windows-gui';
		case 'VencordInstallerCli.exe':
			return 'windows-cli';
		case 'VencordInstaller.MacOS.zip':
			return 'macos-gui';
		case 'VencordInstallerCli-linux':
			return 'linux-cli';
		default:
			return null;
	}
};

const getRelease = async ({
	cache,
	octokit,
	project,
	executionCtx,
}: {
	cache: KVNamespace;
	project: Project;
	octokit: Octokit;
	executionCtx: ExecutionContext;
}): Promise<Release> => {
	const cacheKey = `octokit:getLatestRelease:${project.owner}/${project.repo}`;
	const cachedRelease = await cache.get<Release>(cacheKey, 'json');

	if (!cachedRelease) {
		const latestRelease = await octokit.rest.repos.getLatestRelease(project);
		executionCtx.waitUntil(cache.put(cacheKey, JSON.stringify(latestRelease.data), { expirationTtl: 120 }));
		return latestRelease.data;
	}

	return cachedRelease;
};

const getReleaseAsset = async ({
	cache,
	octokit,
	project,
	assetId,
	executionCtx,
}: {
	cache: KVNamespace;
	project: Project;
	octokit: Octokit;
	assetId: number;
	executionCtx: ExecutionContext;
}): Promise<ReadableStream | null> => {
	const cacheKey = `octokit:getReleaseAsset:${project.owner}/${project.repo}:${assetId}`;
	const cachedAsset = await cache.get(cacheKey, 'stream');

	if (!cachedAsset) {
		const releaseAsset = await octokit.rest.repos.getReleaseAsset({
			owner: project.owner,
			repo: project.repo,
			asset_id: assetId,
			request: { parseSuccessResponseBody: false },
			headers: {
				accept: 'application/octet-stream',
			},
		});

		const assetStream = releaseAsset.data as unknown as ReadableStream;
		const [streamToCache, streamToReturn] = assetStream.tee();
		executionCtx.waitUntil(cache.put(cacheKey, streamToCache));
		return streamToReturn;
	}

	return cachedAsset;
};

/**
 * Mounted at `/v1/releases`
 */
const app = new Hono<HonoEnv & ReleasesEnv>();

app.use('/:project/*', async (c, next) => {
	const projects: Record<string, Project | undefined> = {
		sencordinstaller: { owner: 'sinjs', repo: 'sencordinstaller' },
	};
	const project = projects[c.req.param('project')];

	if (!project) return c.json({ error: 'Not Found', message: 'Project not found' }, 404);

	c.set('project', project);

	return await next();
});

app.get('/:project/latest', async (c) => {
	const returnRelease = (release: Release) => {
		return c.json({
			id: release.id,
			name: release.name,
			tag_name: release.tag_name,
			created_at: release.created_at,
			published_at: release.published_at,
			assets: release.assets.map((asset) => ({
				id: asset.id,
				name: asset.name,
				type: parseAssetType(asset.name),
				state: asset.state,
				size: asset.size,
			})),
		});
	};

	return returnRelease(
		await getRelease({
			cache: c.env.CACHE,
			octokit: c.get('octokit'),
			project: c.get('project'),
			executionCtx: c.executionCtx,
		})
	);
});

app.get('/:project/latest/download/:assetType', async (c) => {
	const assetType = assetTypeEnum.parse(c.req.param('assetType'));
	const project = c.get('project');

	const release = await getRelease({
		cache: c.env.CACHE,
		octokit: c.get('octokit'),
		project,
		executionCtx: c.executionCtx,
	});

	const parsedAssets = release.assets.map((asset) => ({ type: parseAssetType(asset.name), ...asset }));
	const asset = parsedAssets.find((asset) => asset.type === assetType);

	if (!asset)
		return c.json(
			{
				error: 'Not Found',
				message:
					'Asset does not exist. The reason for this might be that the release is still being compiled. This takes about 10-15 minutes to complete.',
			},
			404
		);

	const assetStream = await getReleaseAsset({
		cache: c.env.CACHE,
		octokit: c.get('octokit'),
		project,
		assetId: asset.id,
		executionCtx: c.executionCtx,
	});

	c.header('Content-Disposition', `attachment; filename="${asset.name}"`);
	c.header('Content-Type', 'application/octet-stream');
	return c.body(assetStream);
});

export default app;
