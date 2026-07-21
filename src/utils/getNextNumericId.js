export const getNextNumericId = (items) =>
  String(
    items.reduce((maxId, item) => {
      const id = Number(item.id);
      return Number.isInteger(id) && id > maxId ? id : maxId;
    }, 0) + 1,
  );
