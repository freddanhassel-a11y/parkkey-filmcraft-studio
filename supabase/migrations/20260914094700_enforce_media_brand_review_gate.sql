create or replace function public.enforce_media_brand_review_gate()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'image' and new.approval_status in ('APPROVED', 'EXPORTED') then
    if coalesce(length(trim(new.alt_text)), 0) < 10 then
      raise exception 'Image approval requires reviewed alt text.';
    end if;

    if coalesce((new.brand_review->>'parkkey_logo_ok')::boolean, false) is not true
      or coalesce((new.brand_review->>'parky_ok')::boolean, false) is not true
      or coalesce((new.brand_review->>'alt_text_ok')::boolean, false) is not true then
      raise exception 'Image approval requires ParkKey logo, canonical Parky and alt-text checks.';
    end if;

    if new.brand_reviewed_at is null or new.brand_reviewed_by is null then
      raise exception 'Image approval requires an auditable brand review.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists media_brand_review_gate on public.media_assets;
create trigger media_brand_review_gate
before insert or update of approval_status, alt_text, brand_review, brand_reviewed_at, brand_reviewed_by
on public.media_assets
for each row execute function public.enforce_media_brand_review_gate();
