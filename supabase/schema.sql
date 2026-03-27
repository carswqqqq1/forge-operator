create table if not exists profiles (
  id uuid primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz default now()
);

create table if not exists project_memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  category text not null,
  key text not null,
  value text not null,
  created_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  title text not null,
  prompt text not null,
  status text not null default 'draft',
  model_provider text not null default 'nvidia_free',
  risk_level text not null default 'medium',
  credit_cost integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  index integer not null,
  title text not null,
  status text not null default 'pending',
  details text,
  created_at timestamptz default now()
);

create table if not exists run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  type text not null,
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  type text not null,
  label text not null,
  storage_path text,
  content_preview text,
  created_at timestamptz default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  summary text not null,
  created_at timestamptz default now()
);

create table if not exists runner_instances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  machine_name text not null,
  status text not null default 'offline',
  last_heartbeat_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists model_credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  provider text not null,
  label text not null,
  encrypted_secret text,
  created_at timestamptz default now()
);

create table if not exists usage_ledgers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  run_id uuid references runs(id) on delete set null,
  kind text not null,
  amount integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  plan_tier text not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table if not exists credit_balances (
  profile_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  stripe_checkout_session_id text,
  type text not null,
  delta integer not null,
  description text not null,
  created_at timestamptz default now()
);

create table if not exists checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  stripe_checkout_session_id text unique,
  checkout_kind text not null,
  status text not null default 'created',
  created_at timestamptz default now()
);
