const brandImages = import.meta.glob('../assets/images/brands/*', {
    eager: true,
    query: '?url',
    import: 'default',
});

export function getBrandImage(imageName) {
    return brandImages[`../assets/images/brands/${imageName}`] || '';
}
