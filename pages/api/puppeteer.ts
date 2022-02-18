import type { NextApiRequest, NextApiResponse } from 'next';
const puppeteer = require('puppeteer');

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--incognito'],
    });
    const page = await browser.newPage();
    await page.goto('https://ordlig.se', { waitUntil: 'networkidle0' });
    await page.click('div .close-tutorial-button', ['left']);
    await page.keyboard.type('aorta', { delay: 100 });
    const nodes = await page.$$eval('span.tile', (elements) => {
      return elements
        .map((element) => {
          return {
            position: elements.indexOf(element) + 1,
            character: element.innerText.toLowerCase(),
            result:
              element.className === 'tile incorrect'
                ? 'grey'
                : element.className === 'tile correct'
                ? 'green'
                : element.className === 'tile incorrect'
                ? 'grey'
                : element.className === 'tile partial'
                ? 'yellow'
                : null,
          };
        })
        .filter((x) => x.result !== null);
    });
    console.log(nodes);

    // await browser.close();
    res.status(200).json(null);
  })();
}
