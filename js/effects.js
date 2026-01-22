/**
 * Effect Definitions (Metadata only)
 */

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
    ]
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
      { id: 'x', label: 'X位置', min: 0, max: 10000, value: 0, unit: 'px' },
      { id: 'y', label: 'Y位置', min: 0, max: 10000, value: 0, unit: 'px' },
      { id: 'width', label: '幅', min: 0, max: 10000, value: 0, unit: 'px' },
      { id: 'height', label: '高さ', min: 0, max: 10000, value: 0, unit: 'px' }
    ],
    requiresInteraction: true
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
      {
        id: 'type',
        label: '効果',
        type: 'select',
        options: [
          { value: 'shadow', label: '影（暗く）' },
          { value: 'highlight', label: 'ハイライト（明るく）' }
        ],
        value: 'shadow'
      },
      { id: 'strength', label: '強度', min: 0, max: 1, value: 0.7, step: 0.05, unit: '' },
      { id: 'range', label: '範囲', min: 10, max: 100, value: 50, unit: '%' }
    ],
    requiresSpecialHandling: true
  },
  {
    id: 'spotlight',
    name: 'スポットライト効果',
    desc: '全体を暗くして指定範囲を強調',
    icon: '□',
    controls: [
      {
        id: 'shape',
        label: '形状',
        type: 'select',
        options: [
          { value: 'circle', label: '円' },
          { value: 'rectangle', label: '長方形' }
        ],
        value: 'circle'
      },
      { id: 'x', label: 'X位置', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'y', label: 'Y位置', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'width', label: '幅', min: 10, max: 100, value: 40, unit: '%' },
      { id: 'height', label: '高さ', min: 10, max: 100, value: 30, unit: '%' },
      { id: 'darkness', label: '暗さ', min: 0, max: 1, value: 0.7, step: 0.05, unit: '' },
      { id: 'feather', label: 'ぼかし', min: 0, max: 100, value: 20, unit: '%' }
    ],
    requiresSpecialHandling: true
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
    ]
  },

  {
    id: 'temperature',
    name: '色温度調整',
    desc: '暖色と寒色のバランスを調整',
    icon: '🌡',
    controls: [
      { id: 'temperature', label: '色温度', min: -100, max: 100, value: 0, unit: '' },
      { id: 'tint', label: '色合い', min: -100, max: 100, value: 0, unit: '' }
    ]
  }
];

export function getEffectById(id) {
  return effects.find(e => e.id === id);
}