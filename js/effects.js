//js/effects.js
// エフェクト定義

export const effects = [
  {
    id: 'vignette',
    name: '周辺光量補正',
    desc: '画像の周辺を明るく/暗くして中心を強調',
    icon: '◐',
    controls: [
      { id: 'amount', label: '光量', min: -100, max: 100, value: -60, unit: '' },
      { id: 'midpoint', label: '中心点', min: 0, max: 100, value: 50, unit: '' },
      { id: 'roundness', label: '丸み', min: 0, max: 100, value: 0, unit: '' },
      { id: 'feather', label: 'ぼかし', min: 0, max: 100, value: 50, unit: '' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const amount = params.amount / 100;
      const isLighten = amount > 0;
      const absAmount = Math.abs(amount);

      const midpoint = 1 - (params.midpoint / 100);
      const roundness = params.roundness / 100;
      const feather = params.feather / 100;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const radiusX = canvas.width / 2;
      const radiusY = canvas.height / 2;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const dx = (x - centerX) / radiusX;
          const dy = (y - centerY) / radiusY;

          let dist;
          if (roundness === 0) {
            dist = Math.sqrt(dx * dx + dy * dy);
          } else {
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const maxDist = Math.max(absDx, absDy);
            const ellipseDist = Math.sqrt(dx * dx + dy * dy);

            dist = ellipseDist * (1 - roundness) + maxDist * roundness;
          }

          const innerRadius = midpoint * 0.3;
          const outerRadius = midpoint * 1.2 + 0.2;

          const transitionStart = innerRadius;
          const transitionEnd = innerRadius + (outerRadius - innerRadius) * (0.3 + feather * 0.7);

          let strength = 0;
          if (dist < transitionStart) {
            strength = 0;
          } else if (dist > transitionEnd) {
            strength = 1;
          } else {
            const t = (dist - transitionStart) / (transitionEnd - transitionStart);

            if (feather < 0.5) {
              strength = Math.pow(t, 2 - feather * 2);
            } else {
              strength = t * t * (3 - 2 * t);
            }
          }

          strength *= absAmount;

          const idx = (y * canvas.width + x) * 4;

          if (isLighten) {
            data[idx] = Math.min(255, data[idx] + (255 - data[idx]) * strength);
            data[idx + 1] = Math.min(255, data[idx + 1] + (255 - data[idx + 1]) * strength);
            data[idx + 2] = Math.min(255, data[idx + 2] + (255 - data[idx + 2]) * strength);
          } else {
            data[idx] = data[idx] * (1 - strength);
            data[idx + 1] = data[idx + 1] * (1 - strength);
            data[idx + 2] = data[idx + 2] * (1 - strength);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  },
  {
    id: 'rounded',
    name: '角丸加工',
    desc: 'スーパー楕円で滑らかな角丸を作成',
    icon: '▢',
    controls: [
      { id: 'radius', label: '角丸の大きさ', min: 0, max: 100, value: 20, unit: '%' },
      { id: 'exponent', label: 'スーパー楕円の指数', min: 1.0, max: 5.0, value: 2.5, step: 0.1, unit: '' },
      {
        id: 'background',
        label: '背景色',
        type: 'select',
        options: [
          { value: 'transparent', label: '透明' },
          { value: 'white', label: '白' },
          { value: 'black', label: '黒' },
          { value: 'gray', label: 'グレー' }
        ],
        value: 'transparent'
      },
      {
        id: 'antialias',
        label: 'アンチエイリアス',
        type: 'select',
        options: [
          { value: 'on', label: 'ON' },
          { value: 'off', label: 'OFF' }
        ],
        value: 'on'
      }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgColors = {
        transparent: [0, 0, 0, 0],
        white: [255, 255, 255, 255],
        black: [0, 0, 0, 255],
        gray: [128, 128, 128, 255]
      };
      const bgColor = bgColors[params.background];

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const radiusPercent = params.radius / 100;
      const exponent = params.exponent;
      const useAntialias = params.antialias === 'on';

      const cornerRadius = Math.min(canvas.width, canvas.height) * radiusPercent * 0.5;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const halfWidth = canvas.width / 2;
      const halfHeight = canvas.height / 2;

      function isInsideSuperEllipse(x, y) {
        const dx = x - centerX;
        const dy = y - centerY;

        const edgeX = halfWidth - cornerRadius;
        const edgeY = halfHeight - cornerRadius;

        if (Math.abs(dx) <= edgeX && Math.abs(dy) <= edgeY) {
          return { inside: true, distance: 0 };
        }

        let cornerCenterX, cornerCenterY;

        if (dx > edgeX && dy > edgeY) {
          cornerCenterX = edgeX;
          cornerCenterY = edgeY;
        } else if (dx > edgeX && dy < -edgeY) {
          cornerCenterX = edgeX;
          cornerCenterY = -edgeY;
        } else if (dx < -edgeX && dy > edgeY) {
          cornerCenterX = -edgeX;
          cornerCenterY = edgeY;
        } else if (dx < -edgeX && dy < -edgeY) {
          cornerCenterX = -edgeX;
          cornerCenterY = -edgeY;
        } else {
          return { inside: true, distance: 0 };
        }

        const rx = dx - cornerCenterX;
        const ry = dy - cornerCenterY;

        const normalizedX = Math.abs(rx) / cornerRadius;
        const normalizedY = Math.abs(ry) / cornerRadius;

        const value = Math.pow(normalizedX, exponent) + Math.pow(normalizedY, exponent);
        const distance = value - 1;

        return { inside: value <= 1, distance: distance };
      }

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const result = isInsideSuperEllipse(x, y);
          const idx = (y * canvas.width + x) * 4;

          if (!result.inside) {
            if (useAntialias && result.distance < 0.3) {
              const alpha = Math.min(1, result.distance / 0.3);

              data[idx] = data[idx] * (1 - alpha) + bgColor[0] * alpha;
              data[idx + 1] = data[idx + 1] * (1 - alpha) + bgColor[1] * alpha;
              data[idx + 2] = data[idx + 2] * (1 - alpha) + bgColor[2] * alpha;

              if (params.background === 'transparent') {
                data[idx + 3] = data[idx + 3] * (1 - alpha);
              }
            } else {
              data[idx] = bgColor[0];
              data[idx + 1] = bgColor[1];
              data[idx + 2] = bgColor[2];
              data[idx + 3] = bgColor[3];
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  },
  {
    id: 'crop',
    name: 'トリミング',
    desc: 'ドラッグ操作で画像を切り抜き',
    icon: '✂',
    controls: [
      {
        id: 'preset',
        label: 'アスペクト比',
        type: 'select',
        options: [
          { value: 'free', label: '自由' },
          { value: '1:1', label: '1:1（正方形）' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' }
        ],
        value: 'free'
      },
      { id: 'x', label: 'X位置', min: 0, max: 10000, value: 0, unit: 'px', readonly: true },
      { id: 'y', label: 'Y位置', min: 0, max: 10000, value: 0, unit: 'px', readonly: true },
      { id: 'width', label: '幅', min: 0, max: 10000, value: 0, unit: 'px', readonly: true },
      { id: 'height', label: '高さ', min: 0, max: 10000, value: 0, unit: 'px', readonly: true }
    ],
    requiresInteraction: true,
    apply: (canvas, ctx, img, params, cropSelection) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (cropSelection) {
        ctx.drawImage(
          img,
          cropSelection.x, cropSelection.y, cropSelection.width, cropSelection.height,
          0, 0, canvas.width, canvas.height
        );
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }
  },
  {
    id: 'gradient',
    name: '方向性グラデーション',
    desc: '指定方向に暗く/明るくする',
    icon: '←',
    controls: [
      {
        id: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'left', label: '左から右へ' },
          { value: 'right', label: '右から左へ' },
          { value: 'top', label: '上から下へ' },
          { value: 'bottom', label: '下から上へ' }
        ],
        value: 'left'
      },
      { id: 'strength', label: '強度', min: 0, max: 1, value: 0.7, step: 0.05, unit: '' },
      { id: 'range', label: '範囲', min: 10, max: 100, value: 50, unit: '%' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let x0, y0, x1, y1;
      const range = params.range / 100;

      switch (params.direction) {
        case 'left':
          x0 = 0; y0 = canvas.height / 2;
          x1 = canvas.width * range; y1 = canvas.height / 2;
          break;
        case 'right':
          x0 = canvas.width; y0 = canvas.height / 2;
          x1 = canvas.width * (1 - range); y1 = canvas.height / 2;
          break;
        case 'top':
          x0 = canvas.width / 2; y0 = 0;
          x1 = canvas.width / 2; y1 = canvas.height * range;
          break;
        case 'bottom':
          x0 = canvas.width / 2; y0 = canvas.height;
          x1 = canvas.width / 2; y1 = canvas.height * (1 - range);
          break;
      }

      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, `rgba(0,0,0,${params.strength})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },
  {
    id: 'spotlight',
    name: 'スポットライト効果',
    desc: '全体を暗くして指定範囲を強調',
    icon: '□',
    controls: [
      { id: 'x', label: 'X位置', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'y', label: 'Y位置', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'width', label: '幅', min: 10, max: 100, value: 40, unit: '%' },
      { id: 'height', label: '高さ', min: 10, max: 100, value: 30, unit: '%' },
      { id: 'darkness', label: '暗さ', min: 0, max: 1, value: 0.7, step: 0.05, unit: '' },
      { id: 'feather', label: 'ぼかし', min: 0, max: 100, value: 20, unit: '%' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const rectX = canvas.width * (params.x / 100) - (canvas.width * params.width / 200);
      const rectY = canvas.height * (params.y / 100) - (canvas.height * params.height / 200);
      const rectW = canvas.width * (params.width / 100);
      const rectH = canvas.height * (params.height / 100);
      const featherSize = Math.min(rectW, rectH) * (params.feather / 100);

      ctx.fillStyle = `rgba(0,0,0,${params.darkness})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'destination-out';

      if (featherSize > 0) {
        const innerRadius = Math.max(0, Math.min(rectW, rectH) / 2 - featherSize);
        const outerRadius = Math.min(rectW, rectH) / 2 + featherSize;

        const gradient = ctx.createRadialGradient(
          rectX + rectW / 2, rectY + rectH / 2, innerRadius,
          rectX + rectW / 2, rectY + rectH / 2, outerRadius
        );
        gradient.addColorStop(0, `rgba(0,0,0,${params.darkness})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(rectX - featherSize, rectY - featherSize,
          rectW + featherSize * 2, rectH + featherSize * 2);
      } else {
        ctx.fillStyle = `rgba(0,0,0,${params.darkness})`;
        ctx.fillRect(rectX, rectY, rectW, rectH);
      }

      ctx.globalCompositeOperation = 'source-over';
    }
  },
  {
    id: 'adjust',
    name: '明度・コントラスト',
    desc: '画像全体の明るさと鮮明さを調整',
    icon: '◑',
    controls: [
      { id: 'brightness', label: '明度', min: -100, max: 100, value: 0, unit: '' },
      { id: 'contrast', label: 'コントラスト', min: -100, max: 100, value: 0, unit: '' },
      { id: 'saturation', label: '彩度', min: -100, max: 100, value: 0, unit: '' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const brightness = params.brightness / 100;
      const contrast = (params.contrast + 100) / 100;
      const saturation = (params.saturation + 100) / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r += 255 * brightness;
        g += 255 * brightness;
        b += 255 * brightness;

        r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imageData, 0, 0);
    }
  },
  //js/effects.js に追加（配列の最後に追加）
  {
    id: 'resize',
    name: '拡縮',
    desc: '画像のサイズを変更',
    icon: '⇔',
    controls: [
      {
        id: 'mode',
        label: '拡縮モード',
        type: 'select',
        options: [
          { value: 'percent', label: 'パーセント指定' },
          { value: 'pixel', label: 'ピクセル指定' },
          { value: 'long', label: '長辺基準' },
          { value: 'short', label: '短辺基準' }
        ],
        value: 'percent'
      },
      { id: 'scale', label: 'スケール', type: 'number', min: 10, max: 500, value: 100, unit: '%' },
      { id: 'width', label: '幅', type: 'number', min: 1, max: 10000, value: 1000, unit: 'px' },
      { id: 'height', label: '高さ', type: 'number', min: 1, max: 10000, value: 1000, unit: 'px' },
      {
        id: 'maintainAspect',
        label: 'アスペクト比を維持',
        type: 'select',
        options: [
          { value: 'on', label: 'ON' },
          { value: 'off', label: 'OFF' }
        ],
        value: 'on'
      },
      { id: 'longSide', label: '長辺サイズ', type: 'number', min: 1, max: 10000, value: 1920, unit: 'px' },
      { id: 'shortSide', label: '短辺サイズ', type: 'number', min: 1, max: 10000, value: 1080, unit: 'px' },
      {
        id: 'interpolation',
        label: '補間方法',
        type: 'select',
        options: [
          { value: 'auto', label: '自動' },
          { value: 'pixelated', label: 'ニアレストネイバー' },
          { value: 'smooth', label: 'バイリニア' }
        ],
        value: 'auto'
      },
      { id: 'resultWidth', label: '出力幅', type: 'number', min: 0, max: 10000, value: 0, unit: 'px', readonly: true },
      { id: 'resultHeight', label: '出力高さ', type: 'number', min: 0, max: 10000, value: 0, unit: 'px', readonly: true }
    ],
    requiresSpecialHandling: true,
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 補間方法の設定
      if (params.interpolation === 'pixelated') {
        ctx.imageSmoothingEnabled = false;
      } else if (params.interpolation === 'smooth') {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      } else {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    },
    calculateOutputSize: (originalWidth, originalHeight, params) => {
      let outputWidth, outputHeight;

      switch (params.mode) {
        case 'percent':
          const scale = params.scale / 100;
          outputWidth = Math.round(originalWidth * scale);
          outputHeight = Math.round(originalHeight * scale);
          break;

        case 'pixel':
          if (params.maintainAspect === 'on') {
            // アスペクト比を維持
            const aspectRatio = originalWidth / originalHeight;
            outputWidth = params.width;
            outputHeight = Math.round(outputWidth / aspectRatio);
          } else {
            outputWidth = params.width;
            outputHeight = params.height;
          }
          break;

        case 'long':
          if (originalWidth >= originalHeight) {
            // 横長または正方形
            outputWidth = params.longSide;
            outputHeight = Math.round(outputWidth * originalHeight / originalWidth);
          } else {
            // 縦長
            outputHeight = params.longSide;
            outputWidth = Math.round(outputHeight * originalWidth / originalHeight);
          }
          break;

        case 'short':
          if (originalWidth <= originalHeight) {
            // 縦長または正方形
            outputWidth = params.shortSide;
            outputHeight = Math.round(outputWidth * originalHeight / originalWidth);
          } else {
            // 横長
            outputHeight = params.shortSide;
            outputWidth = Math.round(outputHeight * originalWidth / originalHeight);
          }
          break;

        default:
          outputWidth = originalWidth;
          outputHeight = originalHeight;
      }

      return { width: outputWidth, height: outputHeight };
    }
  },
  {
    id: 'sepia',
    name: 'セピア調',
    desc: 'クラシックな褐色写真風に変換',
    icon: '🎞',
    controls: [
      { id: 'intensity', label: '強度', min: 0, max: 100, value: 80, unit: '%' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const intensity = params.intensity / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // セピアトーン変換式
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;

        // 元の色とセピア色をブレンド
        data[i] = r + (tr - r) * intensity;
        data[i + 1] = g + (tg - g) * intensity;
        data[i + 2] = b + (tb - b) * intensity;
      }

      ctx.putImageData(imageData, 0, 0);
    }
  },
  {
    id: 'grayscale',
    name: 'モノクロ',
    desc: '白黒写真に変換',
    icon: '⚫',
    controls: [
      {
        id: 'method', label: '変換方式', type: 'select',
        options: [
          { value: 'luminosity', label: '輝度（標準）' },
          { value: 'average', label: '平均値' },
          { value: 'desaturation', label: '彩度除去' }
        ],
        value: 'luminosity'
      },
      { id: 'contrast', label: 'コントラスト', min: -50, max: 50, value: 0, unit: '' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const contrastFactor = (params.contrast + 100) / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        let gray;

        switch (params.method) {
          case 'luminosity':
            // 人間の視覚に基づいた重み付け
            gray = 0.299 * r + 0.587 * g + 0.114 * b;
            break;
          case 'average':
            // 単純平均
            gray = (r + g + b) / 3;
            break;
          case 'desaturation':
            // 最大値と最小値の平均
            gray = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
            break;
          default:
            gray = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        // コントラスト調整
        gray = ((gray / 255 - 0.5) * contrastFactor + 0.5) * 255;
        gray = Math.max(0, Math.min(255, gray));

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
    }
  },
  {
    id: 'colorOverlay',
    name: 'カラーオーバーレイ',
    desc: '指定した色を画像に重ねる',
    icon: '🎨',
    controls: [
      { id: 'hue', label: '色相', min: 0, max: 360, value: 200, unit: '°' },
      { id: 'saturation', label: '彩度', min: 0, max: 100, value: 80, unit: '%' },
      { id: 'opacity', label: '不透明度', min: 0, max: 100, value: 30, unit: '%' },
      {
        id: 'blendMode', label: 'ブレンドモード', type: 'select',
        options: [
          { value: 'normal', label: '通常' },
          { value: 'multiply', label: '乗算' },
          { value: 'screen', label: 'スクリーン' },
          { value: 'overlay', label: 'オーバーレイ' }
        ],
        value: 'normal'
      }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // HSLからRGBに変換
      const h = params.hue / 360;
      const s = params.saturation / 100;
      const l = 0.5;

      const hslToRgb = (h, s, l) => {
        let r, g, b;

        if (s === 0) {
          r = g = b = l;
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };

          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      };

      const [overlayR, overlayG, overlayB] = hslToRgb(h, s, l);
      const opacity = params.opacity / 100;

      const blendFunctions = {
        normal: (base, overlay) => overlay,
        multiply: (base, overlay) => (base * overlay) / 255,
        screen: (base, overlay) => 255 - ((255 - base) * (255 - overlay)) / 255,
        overlay: (base, overlay) => {
          return base < 128
            ? (2 * base * overlay) / 255
            : 255 - (2 * (255 - base) * (255 - overlay)) / 255;
        }
      };

      const blendFunc = blendFunctions[params.blendMode];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const blendedR = blendFunc(r, overlayR);
        const blendedG = blendFunc(g, overlayG);
        const blendedB = blendFunc(b, overlayB);

        data[i] = r + (blendedR - r) * opacity;
        data[i + 1] = g + (blendedG - g) * opacity;
        data[i + 2] = b + (blendedB - b) * opacity;
      }

      ctx.putImageData(imageData, 0, 0);
    }
  },
  {
    id: 'temperature',
    name: '色温度調整',
    desc: '暖色と寒色のバランスを調整',
    icon: '🌡',
    controls: [
      { id: 'temperature', label: '色温度', min: -100, max: 100, value: 0, unit: '' },
      { id: 'tint', label: '色合い', min: -100, max: 100, value: 0, unit: '' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const temp = params.temperature / 100;
      const tint = params.tint / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 色温度調整（赤-青バランス）
        if (temp > 0) {
          // 暖色方向
          r += temp * (255 - r) * 0.3;
          b -= temp * b * 0.3;
        } else {
          // 寒色方向
          r += temp * r * 0.3;
          b -= temp * (255 - b) * 0.3;
        }

        // 色合い調整（緑-マゼンタバランス）
        if (tint > 0) {
          // 緑方向
          g += tint * (255 - g) * 0.3;
        } else {
          // マゼンタ方向
          r -= tint * (255 - r) * 0.15;
          b -= tint * (255 - b) * 0.15;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }
];

export function getEffectById(id) {
  return effects.find(e => e.id === id);
}