<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $site = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $static = ['', '/cua-hang', '/faq', '/tin-tuc', '/gio-hang'];

        $urls = [];
        foreach ($static as $path) {
            $urls[] = [
                'loc' => $site.$path,
                'changefreq' => 'weekly',
                'priority' => $path === '' ? '1.0' : '0.8',
            ];
        }

        foreach (Product::orderBy('id')->get(['slug', 'updated_at']) as $product) {
            $urls[] = [
                'loc' => $site.'/san-pham/'.($product->slug ?: $product->id),
                'lastmod' => $product->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.9',
            ];
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($urls as $u) {
            $xml .= '<url>';
            $xml .= '<loc>'.htmlspecialchars($u['loc']).'</loc>';
            if (! empty($u['lastmod'])) {
                $xml .= '<lastmod>'.$u['lastmod'].'</lastmod>';
            }
            $xml .= '<changefreq>'.$u['changefreq'].'</changefreq>';
            $xml .= '<priority>'.$u['priority'].'</priority>';
            $xml .= '</url>';
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
