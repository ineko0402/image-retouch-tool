//js/effects.js
// エフェクト定義

export const effects = [
  {
    id: 'vignette',
    name: 'ビネット効果',
    desc: '画像の周辺を暗くして中心を強調',
    icon: '◐',
    controls: [
      { id: 'x', label: 'X座標', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'y', label: 'Y座標', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'radius', label: '半径', min: 10, max: 100, value: 50, unit: '%' },
      { id: 'strength', label: '強度', min: 0, max: 1, value: 0.6, step: 0.05, unit: '' }
    ],
    apply: (canvas, ctx, img, params) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width * (params.x / 100);
      const centerY = canvas.height * (params.y / 100);
      const radius = Math.max(canvas.width, canvas.height) * (params.radius / 100);
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.3,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${params.strength})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
      
      switch(params.direction) {
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
          rectX + rectW/2, rectY + rectH/2, innerRadius,
          rectX + rectW/2, rectY + rectH/2, outerRadius
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