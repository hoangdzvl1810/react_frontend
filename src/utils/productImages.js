const productImages = require.context(
    '../assets/images/products',
    false,
    /\.(avif|gif|jpe?g|png|svg|webp)$/i,
);

export function getProductImage(imageName) {
    if (!imageName) return '';

    try {
        return productImages(`./${imageName}`);
    } catch {
        return '';
    }
}
