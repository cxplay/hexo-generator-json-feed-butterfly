import { stripHTML } from 'hexo-util';

const specs = {
  rss(site, limit, config) {
    const build = new Date().toUTCString();

    const items = posts(site, limit).map((post) => {
      return {
        title: post.title,
        link: post.permalink,
        description: summary(post),
        pubDate: post.date.toDate().toUTCString(),
        guid: post.permalink,
        category: tags(post),
      }
    });

    const rss = {
      title: config.title,
      description: config.description,
      language: config.language,
      link: config.url,
      webMaster: config.author,
      pubDate: items.length ? items[0].pubDate : build,
      lastBuildDate: build,
      generator: 'hexo-generator-json-feed',
      items,
    };

    return rss
  },

  feed(site, limit, config) {
    const items = posts(site, limit).map((post) => {
      return {
        id: post.permalink,
        url: post.permalink,
        title: post.title,
        content_html: prune(post.content),
        content_text: minify(post.content),
        summary: summary(post),
        date_published: post.date.toDate().toJSON(),
        tags: tags(post),
      }
    });

    const json = {
      version: 'https://jsonfeed.org/version/1',
      name: config.title,
      home_page_url: config.url,
      feed_url: `${config.url}/feed.json`,
      author: {
        name: config.author,
      },
      items,
    };

    return json
  },
};

// Helpers

function minify(str) {
  return stripHTML(str).trim().replace(/\s+/g, ' ')
}

function prune(str) {
  return str
  .replace(/<td class="gutter"><pre>(?:<span class="line">[0-9]+<\/span><br>)+<\/pre><\/td>/g, '') // Prune line numbers
  .replace(/<span class="line">(.*?)<\/span><br>/g, '$1\n') // Prune code span tag
  .replace(/<span class=".*?">(.*?)<\/span>/g, '$1') // Prune code span tag
  .replace(/<figure class="highlight (.*?)"><table><tr><td class="code"><pre>(.*?)<\/pre><\/td><\/tr><\/table><\/figure>/gs, '<pre class="language-$1"><code>$2<\/code><\/pre>') // Refactoring code blocks
  .replace(/<img src= ".*?" data-lazy-src="(.*?)" alt="(.*?)">/g, '<img src="$1" alt="$2" title="$2">') // Prune lazyload img
  .replace(/<span class=".*?">(.*?)<\/span>/g, '$1') // Prune code span tag
  .replace(/\sclass="fas\s.*?"/g, '') // Prune class
  .replace(/\sclass="note\s.*?"/g, ''); // Prune class
}

function posts(site, limit) {
  return site.posts
    .sort('-date')
    .filter((post) => post.published)
    .slice(0, limit || 25)
}

function summary(post) {
  return post.excerpt ? minify(post.excerpt) : minify(post.content)
}

function tags(post) {
  const cats = post.categories.map((cat) => cat.name);
  const tags = post.tags.map((tag) => tag.name);

  return [...cats, ...tags]
}

const { config } = hexo;
const defs = { spec: 'rss', limit: 25 };
const opts = config.jsonFeed || {};
const options = { ...defs, ...opts };
const file = options.spec === 'rss' ? 'rss' : 'feed';

hexo.extend.generator.register('json-feed', (site) => {
  const json = specs[options.spec](site, options.limit, config);

  return {
    path: `${file}.json`,
    data: JSON.stringify(json),
  }
});
