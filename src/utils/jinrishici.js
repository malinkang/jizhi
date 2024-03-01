/*
Copyright 2019 今日诗词

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// 今日诗词 V2 NPM-SDK 1.0.0
// 今日诗词API 是一个可以免费调用的诗词接口：https://www.jinrishici.com
import Storager from './storager';
const load = (callback, errHandler) => {
  // if (window.localStorage && window.localStorage.getItem(keyName)) {
  //   return commonLoad(callback, errHandler, window.localStorage.getItem(keyName));
  // } else {
  Storager.get(['notionToken', 'databaseId'], (res) => {
    console.log(`load ${res.notionToken} ${res.databaseId}`);
    // if (res.fonts && res.fonts.fontName === fontName) {
    //   insertFont(res.fonts.value);
    //   this.setState(() => ({ isFontLoading: false }));
    // } else {
    //   fetchAndSetFont(fontName)
    //     .then(() => {
    //       this.setState(() => ({ isFontLoading: false }));
    //     })
    //     .catch((err) => console.log(err));
    // }
    // const notionToken = Storager.get({ notionToken });
    // const databaseId = Storager.get({ databaseId });
    // console.log(`load ${notionToken} ${databaseId}`);
    return corsLoad(callback, errHandler, res.notionToken, res.databaseId);
  });

  // }
};

const corsLoad = (callback, errHandler, notionToken, databaseId) => {
  const newCallBack = function (result) {
    callback(result);
  };
  return sendRequest(newCallBack, errHandler, notionToken, databaseId);
};
// 初始化Notion客户端
const NOTION_API_BASE = 'https://api.notion.com/v1/';

const NOTION_VERSION = '2022-06-28';
const getRelatedPageProperty = async (notionToken, relatedPageId, propertyName) => {
  const response = await fetch(`${NOTION_API_BASE}pages/${relatedPageId}/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }
  console.log(`${NOTION_API_BASE}pages/${relatedPageId}`);
  const pageData = await response.json();
  console.log(`bb properties: ${pageData.properties}`);

  return pageData.properties[propertyName].relation[0].id; // 获取关联页面的ID
};

const getRelatedPageTitle = async (notionToken, relatedPageId, propertyName) => {
  const response = await fetch(`${NOTION_API_BASE}pages/${relatedPageId}`, {
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
  });
  console.log(`response: ${JSON.stringify(response)}`);
  if (!response.ok) {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }

  const pageData = await response.json();
  return pageData.properties[propertyName].title[0].plain_text; // 假设数据库1和数据库2的标题属性名都是'Name'
};

const sendRequest = async (callback, errHandler, notionToken, databaseId) => {
  try {
    const response = await fetch(`${NOTION_API_BASE}databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const page = data.results[randomIndex];
      const title = page.properties['Name'].title[0].plain_text;
      const bookRelationId = page.properties['书籍'].relation[0].id;
      const bookTitle = await getRelatedPageTitle(notionToken, bookRelationId, '书名'); // 使用之前的函数
      const authorRelationId = await getRelatedPageProperty(notionToken, bookRelationId, '作者');
      const authorName = await getRelatedPageTitle(notionToken, authorRelationId, '标题'); // 使用之前的函数
      const result = {
        status: 'success',
        data: {
          content: title,
          origin: {
            title: bookTitle,
            author: authorName,
          },
        },
      };
      callback(result);
    } else {
      callback({ status: 'success', data: { message: 'No pages found.' } });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    errHandler({ status: 'error', message: error.message });
  }
};

export { load };
