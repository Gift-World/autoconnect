-- Guided listing checklist: photo kind metadata + expanded document kinds
begin;

-- car_images.photo_kind (nullable — legacy rows unaffected)
alter table public.car_images
  add column if not exists photo_kind text;

create index if not exists car_images_car_kind_idx
  on public.car_images(car_id, photo_kind);

-- Extend car_documents.kind to include logbook + seller_id
-- (drop old check, re-add with wider set)
alter table public.car_documents
  drop constraint if exists car_documents_kind_check;

alter table public.car_documents
  add constraint car_documents_kind_check
  check (kind in (
    'logbook','seller_id','inspection','insurance',
    'title','registration','export_cert','customs','other'
  ));

commit;
