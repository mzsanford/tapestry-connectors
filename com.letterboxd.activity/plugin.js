
const EntryType = {
  film: 'Film',
  list: 'List',
  unknown: 'Unknown'
}

let AvatarCache = {};

function parseFeed(text) {
  let jsonRSS = xmlParse(text);
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
    identity.avatar = getAvatar(username);
  }

  return identity;
}

function getAvatar(username) {
  if (AvatarCache[username]) {
    return AvatarCache[username];
  } else if (AvatarCache.hasOwnProperty(username)) {
    return undefined;
  } else {
    AvatarCache[username] = undefined;
    findAvatar(username)
      .then((avatar) => {
        AvatarCache[username] = avatar;
      });
    return undefined;
  }
}

function findAvatar(username) {
  return sendRequest(`https://letterboxd.com/${username}`)
    .then((text) => {
      const avatar = /src="(http[^"]+\/avatar\/[^"]+)"/.exec(text);
      if (avatar && avatar.length > 1) {
        AvatarCache[username] = avatar[1];
        return avatar[1];
      } else {
        return undefined;
      }
    });
}

function verify() {
  findAvatar(username)
    .then((avatar) => {
      if (avatar) {
        const verification = {
          displayName: `Letterboxd: @${username}`,
          baseUrl: `https://letterboxd.com/${username}`,
          icon: avatar
        }
        processVerification(verification);
      } else {
        processVerification(`Letterboxd: @${username}`);
      }
    })
    .catch((error) => {
      processError(error);
    });
}

function load() {
  const endpoint = `https://letterboxd.com/${username}/rss/`;
  findAvatar(username)
    .then(() => {
      sendRequest(endpoint)
        .then((text) => {
          processResults(parseFeed(text));
        })
        .catch((requestError) => {
          processError(requestError);
        });
    });
}