create table public.buyer*home_owner_tbl (
id bigserial not null,
full_name character varying(255) not null,
email character varying(255) not null,
phone character varying(50) null,
status character varying(50) null default 'active'::character varying,
unit_number character varying(50) not null,
property_id uuid null,
monthly_dues numeric(15, 2) null default 0,
move_in_date date null,
emergency_contact_name character varying(255) null,
emergency_contact_phone character varying(50) null,
total_property_price numeric(15, 2) null default 0,
down_payment numeric(15, 2) null default 0,
interest_rate numeric(5, 4) null default 0.0500,
remaining_balance numeric(15, 2) null default 0,
monthly_interest numeric(15, 2) null default 0,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
constraint buyer_home_owner_tbl_pkey primary key (id),
constraint buyer_home_owner_tbl_email_key unique (email),
constraint buyer_home_owner_tbl_property_id_fkey foreign KEY (property_id) references property_info_tbl (property_id) on delete set null,
constraint homeowner_phone_check check (
(
(phone is null)
or (length((phone)::text) >= 10)
)
),
constraint buyer_home_owner_tbl_status_check check (
(
(status)::text = any (
(
array[
'active'::character varying,
'inactive'::character varying,
'pending'::character varying
]
)::text[]
)
)
),
constraint homeowner_email_check check (
(
(email)::text ~\* '^[A-Za-z0-9.*%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
)
),
constraint homeowner_financial_check check (
(
(total_property_price >= (0)::numeric)
and (down_payment >= (0)::numeric)
and (remaining_balance >= (0)::numeric)
and (monthly_interest >= (0)::numeric)
and (interest_rate >= (0)::numeric)
)
)
) TABLESPACE pg_default;
