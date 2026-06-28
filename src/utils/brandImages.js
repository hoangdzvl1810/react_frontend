const brandImages = require.context(
    '../assets/images/brands',
    false,
    /\.(avif|gif|jpe?g|png|svg|webp)$/i,
);

export function getBrandImage(imageName) {
    if (!imageName) return '';

    try {
        return brandImages(`./${imageName}`);
    } catch {
        return '';
    }
}
