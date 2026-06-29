// 生成 9:16 分享图并保存到相册
const brand = require('./brand.js');

function drawShare(card, ctx, w, h) {
  const bg = '#F7F5F2';
  const cardBg = 'rgba(255,255,255,0.92)';
  const accent = '#6B8CAE';
  const ink = '#2A2E37';
  const inkMuted = 'rgba(42,46,55,0.65)';
  const lotus = '#D8A7B0';

  ctx.setFillStyle(bg);
  ctx.fillRect(0, 0, w, h);

  ctx.setStrokeStyle('rgba(44, 38, 32, 0.08)');
  ctx.setLineWidth(1);
  ctx.setFillStyle(cardBg);
  roundRect(ctx, 40, 120, w - 80, h - 280, 24);
  ctx.fill();
  roundRect(ctx, 40, 120, w - 80, h - 280, 24);
  ctx.stroke();

  ctx.setFillStyle(accent);
  ctx.setFontSize(22);
  ctx.fillText(brand.NAME, 60, 80);

  ctx.setFillStyle(accent);
  ctx.setFontSize(20);
  const typeLabel = card.eventType || card.cat || '活动';
  ctx.fillText(typeLabel, 60, 180);

  ctx.setFillStyle(ink);
  ctx.setFontSize(28);
  wrapText(ctx, card.title || '', 60, 230, w - 120, 36, 3);

  ctx.setFillStyle(inkMuted);
  ctx.setFontSize(20);
  wrapText(ctx, card.summary || '', 60, 340, w - 120, 30, 4);

  if (card.deadline) {
    ctx.setFillStyle(lotus);
    ctx.setFontSize(22);
    ctx.fillText('截止 ' + card.deadline, 60, h - 220);
  }
  if (card.place) {
    ctx.setFillStyle(inkMuted);
    ctx.fillText(card.place, 60, h - 180);
  }

  ctx.setFillStyle('#A39E97');
  ctx.setFontSize(18);
  ctx.fillText(brand.NAME + ' · ' + brand.SLOGAN, 60, h - 100);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
  const chars = (text || '').split('');
  let line = '';
  let ly = y;
  let lines = 0;
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly);
      line = chars[i];
      ly += lineH;
      lines++;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, ly);
}

function exportCanvas(canvasId, page) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvasId,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    }, page);
  });
}

function saveAndShare(tempPath) {
  wx.saveImageToPhotosAlbum({
    filePath: tempPath,
    success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
    fail: () => wx.previewImage({ urls: [tempPath] })
  });
}

module.exports = { drawShare, exportCanvas, saveAndShare };
