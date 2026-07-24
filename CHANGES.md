# LeaseGuard — v2 Changes

Implemented changes derived from the Phase 1 survey analysis.

## Database migration (run first)

The schema adds fields to `Property` and `Image`. From the `server` directory:

```bash
npm install
npx prisma migrate dev --name add_inspection_metadata_and_caption
npx prisma generate
```

New `Property` fields: `inspectionType` (CHECKIN | CHECKOUT, default CHECKIN),
`moveInDate`, `depositAmount`, `depositScheme`, `landlordName`.
New `Image` field: `caption`.

## Backend changes

- **Image ownership fix (security):** `getImagesByRoom` and `getImageById` now scope
  to the requesting user. Previously any authenticated user could read another
  user's images by ID.
- **Aggregated summary endpoint:** `GET /api/properties/:id/summary` returns rooms
  with image and issue counts in a single query, replacing the frontend N+1 waterfall.
- **CRUD added:** update/delete for property, room, image (incl. caption update),
  and delete for annotation.
- **Report + property** now carry the new tenancy metadata.

## Frontend changes

- Property form captures inspection type and tenancy metadata.
- Property page uses the single summary endpoint, shows metadata, an evidence
  completeness banner, and per-room condition badges.
- Room page shows a documentation checklist and supports photo captions and deletes.
- Image page supports annotation deletion and shows the caption.
- Report shows the metadata block, derived room condition status, and captions.
- Dashboard "Reports" stat replaced with "Issues Logged".
- All `alert()` calls replaced with an inline `Toast` component.

## Tests

Backend suite (Jest + Supertest), runs with mocked Prisma and Cloudinary — no DB needed:

```bash
cd server
npm install
npm test
```

33 tests across auth, properties, ownership (security), room/image/annotation CRUD,
and the room-condition unit rules.

See `L39597059_PatriciaAdeleke_LeaseGuard_Testing.docx` for the full test-case table
and the manual click-through verification script.
