import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const months = ['February', 'March', 'April'];

const BLURB = `Discover the power of encountering suffering and expecting the Messiah through the pages of the Ketuvim during the Lenten season.`;

const DETAILS = ``;

const formatter = (val) => {
  const [month, day] = val.split(' ');
  const monthIndex = months.indexOf(month);
  return `${monthIndex + 2}/${day}`;
};

const dayTemplate = (day, idx) => {
  const cx = [];
  if (day.weekday === 'Friday') {
    cx.push('friday');
  }
  if (day.weekday === 'Wednesday' && idx === 0) {
    cx.push('ash-wednesday');
  }
  return `<li${cx.length ? ` class=${cx.join(' ')}` : ''}>
    <span>${formatter(day.date)}</span>
    <span title="${day.chapters} chapters total">${day.reading}</span>
    <span>${cx.includes('ash-wednesday') ? 'Ash ' : ''}${day.weekday}${
    day.weekday === 'Friday' ? ' ✝' : ''
  }</span>
</li>`;
};

const weekTemplate = (week, idx) => `<div class="week">
    <h2>Week ${idx + 1}</h2>
    <p>${week.prayer}</p>
    <ul>
        ${week.days.map(dayTemplate).join('\n')}
    </ul>
</div>`;

(async () => {
  const results = Papa.parse(await fs.readFile(path.join(process.cwd(), 'data.csv'), 'utf8'));
  let lastPrayer = '';
  const weeks = [];
  let week = [];

  const data = results.data.slice(1).map((row) => ({
    weekday: row[0],
    date: row[1],
    reading: row[2],
    chapters: row[3],
    prayer: row[4],
  }));

  for (const row of data) {
    if (!!lastPrayer && row.prayer !== lastPrayer) {
      weeks.push(week);
      week = [];
    }
    week.push(row);
    lastPrayer = row.prayer;
  }

  weeks.push(week);

  const mappedWeeks = weeks.map((week) => ({
    prayer: week[0].prayer,
    days: week.map((day) => ({
      weekday: day.weekday,
      date: day.date,
      chapters: day.chapters,
      reading: day.reading,
    })),
  }));

  const content = `<aside><div class="content"><h1>Read<span class="cross"></span>Lent</h1><p>${BLURB}</p></div></aside><section class="weeks">${mappedWeeks
    .map(weekTemplate)
    .join('\n')}</section>`;
  const doc = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf8');
  const $ = cheerio.load(doc);
  $('#app').html(content);
  await fs.writeFile(path.join(process.cwd(), 'index.html'), $.html());
})();
