const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

app.post('/generate', async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing HTML content' });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=receipt.pdf' });
  res.send(pdf);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`PDF service listening on ${port}`));
