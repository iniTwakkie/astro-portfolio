import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import site from '../data/site.json';

export const prerender = true;

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: APIRoute = async (context) => {
	const origin = context.site ?? new URL('https://danienell.com');

	const posts = (await getCollection('blog'))
		.filter((post) => post.data.published !== false)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	const items = posts
		.map((post) => {
			const url = new URL(`/blog/${post.id.toLowerCase()}/`, origin);
			return `<item>
    <title>${escapeXml(post.data.title)}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${post.data.date.toUTCString()}</pubDate>
    <description>${escapeXml(post.data.description ?? '')}</description>
</item>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(site.title)}</title>
<link>${origin}</link>
<description>${escapeXml(site.description)}</description>
<atom:link href="${new URL('/rss.xml', origin)}" rel="self" type="application/rss+xml"/>
<language>en</language>
${items}
</channel>
</rss>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};