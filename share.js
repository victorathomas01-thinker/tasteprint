const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const BG = '#0b0d10';
const PANEL = '#141820';
const TEXT = '#f5f7fb';
const MUTED = '#a5aeba';
const ACCENT = '#5b8cff';
const ACCENT_SOFT = 'rgba(91, 140, 255, 0.20)';

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 6) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);

  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function pill(ctx, text, x, y) {
  ctx.font = '600 30px system-ui, -apple-system, Segoe UI, sans-serif';
  const width = Math.min(850, ctx.measureText(text).width + 54);
  roundedRect(ctx, x, y, width, 58, 29);
  ctx.fillStyle = ACCENT_SOFT;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.fillText(text, x + 27, y + 39);
  return width;
}

function extractStory(story) {
  const eyebrow = story.querySelector('.eyebrow')?.textContent?.trim() || 'Tasteprint';
  const primary = story.querySelector('h2')?.textContent?.trim() || 'My Tasteprint';
  const secondary = story.querySelector('h3')?.textContent?.trim() || '';
  const badges = [...story.querySelectorAll('.badge')]
    .map((node) => node.textContent.trim())
    .filter(Boolean)
    .slice(0, 4);
  const small = [...story.querySelectorAll('.small')]
    .map((node) => node.textContent.trim())
    .filter(Boolean);

  const isPair = /together/i.test(eyebrow) || /match/i.test(primary);
  return { eyebrow, primary, secondary, badges, small, isPair };
}

function createStoryCanvas(story) {
  const data = extractStory(story);
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, '#0c0f14');
  gradient.addColorStop(0.55, '#151b27');
  gradient.addColorStop(1, '#0a0c10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = ctx.createRadialGradient(855, 265, 20, 855, 265, 520);
  glow.addColorStop(0, 'rgba(91,140,255,.34)');
  glow.addColorStop(1, 'rgba(91,140,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, 900);

  ctx.fillStyle = MUTED;
  ctx.font = '700 28px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(data.eyebrow.toUpperCase(), 78, 115);

  ctx.fillStyle = TEXT;
  ctx.font = data.isPair
    ? '800 116px system-ui, -apple-system, Segoe UI, sans-serif'
    : '800 92px system-ui, -apple-system, Segoe UI, sans-serif';

  let y = wrapText(ctx, data.primary, 78, 280, 910, data.isPair ? 122 : 102, 4);

  if (data.secondary) {
    ctx.fillStyle = '#dbe3f3';
    ctx.font = '650 42px system-ui, -apple-system, Segoe UI, sans-serif';
    y += 38;
    y = wrapText(ctx, data.secondary, 78, y, 900, 54, 3);
  }

  if (data.badges.length) {
    let px = 78;
    let py = y + 60;
    for (const badge of data.badges) {
      ctx.font = '600 30px system-ui, -apple-system, Segoe UI, sans-serif';
      const width = Math.min(850, ctx.measureText(badge).width + 54);
      if (px + width > 1002) {
        px = 78;
        py += 76;
      }
      pill(ctx, badge, px, py);
      px += width + 14;
    }
    y = py + 92;
  }

  const details = data.small.slice(-4);
  if (details.length) {
    roundedRect(ctx, 66, Math.max(y + 10, 1250), 948, 400, 34);
    ctx.fillStyle = PANEL;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = 2;
    ctx.stroke();

    let detailY = Math.max(y + 10, 1250) + 74;
    for (const line of details) {
      ctx.fillStyle = MUTED;
      ctx.font = '500 30px system-ui, -apple-system, Segoe UI, sans-serif';
      detailY = wrapText(ctx, line, 108, detailY, 860, 43, 2) + 28;
    }
  }

  ctx.fillStyle = ACCENT;
  roundedRect(ctx, 78, 1774, 64, 12, 6);
  ctx.fill();
  ctx.fillStyle = TEXT;
  ctx.font = '700 34px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('TASTEPRINT', 78, 1845);
  ctx.fillStyle = MUTED;
  ctx.font = '500 27px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('Figure out what fits you next.', 78, 1886);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not generate image.'));
    }, 'image/png', 1);
  });
}

function filenameFor(story) {
  const title = story.querySelector('h2')?.textContent || 'tasteprint';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `tasteprint-${slug || 'result'}.png`;
}

async function downloadStory(story) {
  const canvas = createStoryCanvas(story);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameFor(story);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareStory(story) {
  const canvas = createStoryCanvas(story);
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filenameFor(story), { type: 'image/png' });
  const title = story.querySelector('h2')?.textContent?.trim() || 'My Tasteprint';

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Tasteprint — ${title}`,
      text: 'I got my Tasteprint. Take yours and compare.'
    });
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Tasteprint — ${title}`,
        text: 'I got my Tasteprint. Take yours and compare.',
        url: location.href
      });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }

  await downloadStory(story);
}

function addShareTools(story) {
  if (story.dataset.shareReady === 'true') return;
  story.dataset.shareReady = 'true';

  const tools = document.createElement('div');
  tools.className = 'share-tools';
  tools.innerHTML = `
    <button type="button" class="primary share-result">Share my Tasteprint</button>
    <button type="button" class="secondary download-result">Download 9:16 PNG</button>
    <p class="small share-note">Built for Instagram Stories and native mobile sharing.</p>
  `;

  story.insertAdjacentElement('afterend', tools);

  tools.querySelector('.share-result').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparing image…';
    try {
      await shareStory(story);
    } catch (error) {
      console.error(error);
      button.textContent = 'Could not share';
      setTimeout(() => { button.textContent = old; }, 1800);
    } finally {
      button.disabled = false;
      if (button.textContent === 'Preparing image…') button.textContent = old;
    }
  });

  tools.querySelector('.download-result').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Generating PNG…';
    try {
      await downloadStory(story);
    } catch (error) {
      console.error(error);
      button.textContent = 'Could not generate';
      setTimeout(() => { button.textContent = old; }, 1800);
    } finally {
      button.disabled = false;
      if (button.textContent === 'Generating PNG…') button.textContent = old;
    }
  });
}

function scan() {
  document.querySelectorAll('.story').forEach(addShareTools);
}

const observer = new MutationObserver(scan);
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
scan();
