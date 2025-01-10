function rgbToHex(rgb: string) {
  const result = rgb.match(/\d+/g);

  if (!result || result.length !== 3) {
    throw new Error("Invalid RGB string");
  }
  // 获取 r, g, b 数值
  const [r, g, b] = result.map(Number);

  // 确保 RGB 值在有效范围内
  const clamp = (x: number) => Math.min(255, Math.max(0, x));

  // 转换为 HEX 格式
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b))
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

export function colorsEqual(color1: string, color2: string) {
  // 判断第一个颜色是 RGB 还是 HEX，并转化为 RGB 数组
  let hex1: string = color1;
  let hex2: string = color2;

  if (color1.startsWith("rgb")) {
    hex1 = rgbToHex(color1);
  }

  if (color2.startsWith("rgb")) {
    hex2 = rgbToHex(color2);
  }

  if (!hex1 || !hex2) {
    throw new Error("Invalid color format");
  }
  return hex1.toUpperCase() === hex2.toUpperCase();
}

export function colorNameToRgb(colorName: string) {
  // 创建一个临时的 canvas 元素
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // 设置 canvas 的大小为 1x1 像素
  canvas.width = 1;
  canvas.height = 1;

  // 将颜色设置为该像素的填充颜色
  ctx.fillStyle = colorName;
  ctx.fillRect(0, 0, 1, 1);

  // 获取该像素的颜色信息
  const pixel = ctx.getImageData(0, 0, 1, 1).data;

  // 返回 RGB 格式的字符串
  return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
}
