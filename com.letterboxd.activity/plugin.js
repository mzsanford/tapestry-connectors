
const EntryType = {
  film: 'Film',
  list: 'List',
  unknown: 'Unknown'
}

function parseFeed(text) {
  const jsonRSS = xmlParse(text);
  return jsonRSS.rss.channel.item.map((rssItem) => {
    let entryType = parseType(rssItem);
    if (entryType === EntryType.film) {
      return createFilmEntry(rssItem);
    } else if (entryType === EntryType.list) {
      return createListEntry(rssItem);
    } else {
      // Fallback on Film style
      console.log(`Unknown entry type: ${rssItem.guid}`);
      return createFilmEntry(rssItem);
    }
  });
}

function createFilmEntry(rssItem) {
  let item = Item.createWithUriDate(rssItem.link, Date.parse(rssItem.pubDate));
  item.title = rssItem.title;
  item.body = rssItem.description;
  item.author = parseAuthor(rssItem);
  return item;
}

function createListEntry(rssItem) {
  let item = Item.createWithUriDate(rssItem.link, Date.parse(rssItem.pubDate));
  item.title = `Listed: ${rssItem.title}`;
  item.body = rssItem.description;
  item.author = parseAuthor(rssItem);
  return item;
}

function parseType(rssItem) {
  if (rssItem.guid.indexOf('-review-') > 0) {
    return EntryType.film;
  } else if (rssItem.guid.indexOf('-watch-') > 0) {
    return EntryType.film;
  } else if (rssItem.guid.indexOf('-list-') > 0) {
    return EntryType.list;
  }

  return EntryType.unknown;
}

function parseAuthor(rssItem) {
  let dcCreator = rssItem["dc:creator"];
  if (!dcCreator) {
    return undefined;
  }

  const identity = Identity.createWithName(dcCreator);

  const parts = /^(https:..letterboxd.com\/([^\/]+))(.*)$/.exec(rssItem.link);
  if (parts && parts.length >= 2) {
    identity.username = `@${parts[2]}`;
    identity.uri = parts[1];
  }

  return identity;
}

function load() {
  let base = 'https://letterboxd.com';
	const endpoint = `${base}/${username}/rss/`;
	sendRequest(endpoint)
	.then((text) => {
		processResults(parseFeed(text));
	})
	.catch((requestError) => {
		processError(requestError);
	});
}