// In-memory mock of the Prisma client used by the app.
// Lets the integration tests run without a real database.
// It supports the exact query shapes the controllers use.

function makeStore() {
  return {
    users: [],
    properties: [],
    rooms: [],
    images: [],
    annotations: [],
    seq: { user: 0, property: 0, room: 0, image: 0, annotation: 0 }
  };
}

let store = makeStore();

const nextId = (key) => (store.seq[key] += 1);

// --- helpers to resolve ownership chains ---
const roomOwner = (room) => {
  const property = store.properties.find((p) => p.id === room.propertyId);
  return property ? property.userId : null;
};
const imageOwner = (image) => {
  const room = store.rooms.find((r) => r.id === image.roomId);
  return room ? roomOwner(room) : null;
};
const annotationOwner = (ann) => {
  const image = store.images.find((i) => i.id === ann.imageId);
  return image ? imageOwner(image) : null;
};

const matchUserFilter = (where, resolveUserId, entity) => {
  // Handles nested where filters like { id, userId } or
  // { id, property: { userId } } / { room: { property: { userId } } }
  if (where.id !== undefined && entity.id !== where.id) return false;
  if (where.userId !== undefined && entity.userId !== where.userId) return false;
  if (where.email !== undefined && entity.email !== where.email) return false;
  if (where.roomId !== undefined && entity.roomId !== where.roomId) return false;
  if (where.propertyId !== undefined && entity.propertyId !== where.propertyId) return false;
  if (where.imageId !== undefined && entity.imageId !== where.imageId) return false;

  // Nested ownership resolution
  if (where.property && where.property.userId !== undefined) {
    if (resolveUserId(entity) !== where.property.userId) return false;
  }
  if (where.room && where.room.property && where.room.property.userId !== undefined) {
    if (resolveUserId(entity) !== where.room.property.userId) return false;
  }
  if (where.image && where.image.room && where.image.room.property &&
      where.image.room.property.userId !== undefined) {
    if (resolveUserId(entity) !== where.image.room.property.userId) return false;
  }
  return true;
};

const prisma = {
  __reset: () => { store = makeStore(); },
  __store: () => store,

  user: {
    findUnique: async ({ where }) =>
      store.users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) || null,
    create: async ({ data }) => {
      const user = { id: nextId("user"), createdAt: new Date(), ...data };
      store.users.push(user);
      return user;
    }
  },

  property: {
    findMany: async ({ where, orderBy }) => {
      let rows = store.properties.filter((p) =>
        where?.userId !== undefined ? p.userId === where.userId : true
      );
      return rows;
    },
    findFirst: async ({ where, include }) => {
      const p = store.properties.find((row) =>
        matchUserFilter(where, () => row.userId, row)
      );
      if (!p) return null;
      return includeProperty(p, include);
    },
    create: async ({ data }) => {
      const property = {
        id: nextId("property"),
        createdAt: new Date(),
        inspectionType: "CHECKIN",
        moveInDate: null,
        depositAmount: null,
        depositScheme: null,
        landlordName: null,
        ...data
      };
      store.properties.push(property);
      return property;
    },
    update: async ({ where, data }) => {
      const p = store.properties.find((row) => row.id === where.id);
      Object.assign(p, data);
      return p;
    },
    delete: async ({ where }) => {
      const idx = store.properties.findIndex((row) => row.id === where.id);
      const [removed] = store.properties.splice(idx, 1);
      // cascade
      const roomIds = store.rooms.filter((r) => r.propertyId === removed.id).map((r) => r.id);
      store.rooms = store.rooms.filter((r) => r.propertyId !== removed.id);
      const imageIds = store.images.filter((i) => roomIds.includes(i.roomId)).map((i) => i.id);
      store.images = store.images.filter((i) => !roomIds.includes(i.roomId));
      store.annotations = store.annotations.filter((a) => !imageIds.includes(a.imageId));
      return removed;
    }
  },

  room: {
    findFirst: async ({ where }) => {
      return (
        store.rooms.find((row) => matchUserFilter(where, roomOwner, row)) || null
      );
    },
    create: async ({ data }) => {
      const room = { id: nextId("room"), createdAt: new Date(), ...data };
      store.rooms.push(room);
      return room;
    },
    update: async ({ where, data }) => {
      const r = store.rooms.find((row) => row.id === where.id);
      Object.assign(r, data);
      return r;
    },
    delete: async ({ where }) => {
      const idx = store.rooms.findIndex((row) => row.id === where.id);
      const [removed] = store.rooms.splice(idx, 1);
      const imageIds = store.images.filter((i) => i.roomId === removed.id).map((i) => i.id);
      store.images = store.images.filter((i) => i.roomId !== removed.id);
      store.annotations = store.annotations.filter((a) => !imageIds.includes(a.imageId));
      return removed;
    }
  },

  image: {
    findMany: async ({ where }) =>
      store.images
        .filter((i) => (where?.roomId !== undefined ? i.roomId === where.roomId : true))
        .sort((a, b) => b.createdAt - a.createdAt),
    findFirst: async ({ where, include }) => {
      const img = store.images.find((row) => matchUserFilter(where, imageOwner, row));
      if (!img) return null;
      return includeImage(img, include);
    },
    findUnique: async ({ where, include }) => {
      const img = store.images.find((row) => row.id === where.id);
      if (!img) return null;
      return includeImage(img, include);
    },
    create: async ({ data }) => {
      const image = { id: nextId("image"), createdAt: new Date(), caption: null, ...data };
      store.images.push(image);
      return image;
    },
    update: async ({ where, data }) => {
      const i = store.images.find((row) => row.id === where.id);
      Object.assign(i, data);
      return i;
    },
    delete: async ({ where }) => {
      const idx = store.images.findIndex((row) => row.id === where.id);
      const [removed] = store.images.splice(idx, 1);
      store.annotations = store.annotations.filter((a) => a.imageId !== removed.id);
      return removed;
    }
  },

  annotation: {
    findFirst: async ({ where }) =>
      store.annotations.find((row) => matchUserFilter(where, annotationOwner, row)) || null,
    create: async ({ data }) => {
      const annotation = { id: nextId("annotation"), createdAt: new Date(), ...data };
      store.annotations.push(annotation);
      return annotation;
    },
    delete: async ({ where }) => {
      const idx = store.annotations.findIndex((row) => row.id === where.id);
      const [removed] = store.annotations.splice(idx, 1);
      return removed;
    }
  }
};

// --- include resolvers ---
function includeProperty(p, include) {
  if (!include) return { ...p };
  const result = { ...p };
  if (include.rooms) {
    let rooms = store.rooms.filter((r) => r.propertyId === p.id);
    rooms = rooms.map((r) => {
      const copy = { ...r };
      const roomInclude = include.rooms.include;
      if (roomInclude?.images) {
        let imgs = store.images.filter((i) => i.roomId === r.id);
        copy.images = imgs.map((i) => {
          const ic = { ...i };
          const imgInclude = roomInclude.images.include;
          if (imgInclude?._count) {
            ic._count = {
              annotations: store.annotations.filter((a) => a.imageId === i.id).length
            };
          }
          if (imgInclude?.annotations) {
            ic.annotations = store.annotations.filter((a) => a.imageId === i.id);
          }
          return ic;
        });
      }
      return copy;
    });
    result.rooms = rooms;
  }
  return result;
}

function includeImage(img, include) {
  const result = { ...img };
  if (include?.annotations) {
    result.annotations = store.annotations.filter((a) => a.imageId === img.id);
  }
  return result;
}

module.exports = prisma;
