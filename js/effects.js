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
    
    // 光量を0-1の範囲に正規化（符号を保持）
    const amount = params.amount / 100;
    const isLighten = amount > 0;
    const absAmount = Math.abs(amount);
    
    // 中心点（0で効果範囲広い、100で効果範囲狭い）
    const midpoint = 1 - (params.midpoint / 100);
    
    // 丸み（0で楕円、100で長方形）
    const roundness = params.roundness / 100;
    
    // ぼかし（0でくっきり、100で滑らか）
    const feather = params.feather / 100;
    
    // グラデーションマスクを作成
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 半径の基準
    const radiusX = canvas.width / 2;
    const radiusY = canvas.height / 2;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // 中心からの正規化された距離
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        
        // 丸みに応じた距離計算
        let dist;
        if (roundness === 0) {
          // 標準の楕円
          dist = Math.sqrt(dx * dx + dy * dy);
        } else {
          // 長方形に近づける
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const maxDist = Math.max(absDx, absDy);
          const ellipseDist = Math.sqrt(dx * dx + dy * dy);
          
          // roundnessが大きいほど長方形に近づく
          dist = ellipseDist * (1 - roundness) + maxDist * roundness;
        }
        
        // 中心点とぼかしを考慮した強度計算
        // midpointが小さい（中心点の値が大きい）ほど、効果が中心に集中
        const innerRadius = midpoint * 0.3;
        const outerRadius = midpoint * 1.2 + 0.2;
        
        // ぼかしで遷移幅を調整
        const transitionStart = innerRadius;
        const transitionEnd = innerRadius + (outerRadius - innerRadius) * (0.3 + feather * 0.7);
        
        let strength = 0;
        if (dist < transitionStart) {
          strength = 0;
        } else if (dist > transitionEnd) {
          strength = 1;
        } else {
          // スムーズなグラデーション
          const t = (dist - transitionStart) / (transitionEnd - transitionStart);
          
          if (feather < 0.5) {
            // ぼかしが少ない：急激な変化
            strength = Math.pow(t, 2 - feather * 2);
          } else {
            // ぼかしが多い：滑らかな変化
            strength = t * t * (3 - 2 * t); // smoothstep
          }
        }
        
        strength *= absAmount;
        
        const idx = (y * canvas.width + x) * 4;
        
        if (isLighten) {
          // 明るくする
          data[idx] = Math.min(255, data[idx] + (255 - data[idx]) * strength);
          data[idx + 1] = Math.min(255, data[idx + 1] + (255 - data[idx + 1]) * strength);
          data[idx + 2] = Math.min(255, data[idx + 2] + (255 - data[idx + 2]) * strength);
        } else {
          // 暗くする
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

      // 全体を暗くする
      ctx.fillStyle = `rgba(0,0,0,${params.darkness})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // スポットライト部分を明るく戻す（ぼかし付き）
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

        // 明度調整
        r += 255 * brightness;
        g += 255 * brightness;
        b += 255 * brightness;

        // コントラスト調整
        r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

        // 彩度調整
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
  }
];

export function getEffectById(id) {
  return effects.find(e => e.id === id);
}