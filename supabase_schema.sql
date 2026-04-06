-- Plataforma de Historias Clínicas Odontológicas
-- Esquema Inicial para Supabase

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. Tabla de Pacientes
create table public.patients (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default now() not null,
    user_id uuid references auth.users(id) not null, -- Propietario (Dentista)
    full_name text not null,
    document_id text,
    birth_date date,
    gender text,
    phone text,
    email text,
    address text,
    folio text -- ID Paciente (PAC-XXXX)
);

-- Asegurar que el folio sea único por doctor
alter table public.patients add constraint unique_folio_per_user unique (user_id, folio);

-- 2. Tabla de Historias Clínicas (SOAP)
create table public.clinical_records (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default now() not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    doctor_id uuid references auth.users(id) not null,
    subjective text,  -- Motivo de consulta, síntomas
    objective text,   -- Hallazgos clínicos, signos
    assessment text,  -- Diagnóstico inicial/Análisis
    plan text         -- Tratamiento propuesto
);

-- 3. Tabla de Medicamentos / Prescripciones
create table public.medications (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default now() not null,
    record_id uuid references public.clinical_records(id) on delete cascade not null,
    name text not null,
    dosage text,
    frequency text,
    indications text
);

-- 4. Tabla de Citas
create table public.appointments (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default now() not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    doctor_id uuid references auth.users(id) not null,
    appointment_date timestamp with time zone not null,
    procedure text,
    observations text,
    status text default 'pendiente' -- pendiente, completada, cancelada
);

-- RLS (Row Level Security)
alter table public.patients enable row level security;
alter table public.clinical_records enable row level security;
alter table public.medications enable row level security;
alter table public.appointments enable row level security;

-- Políticas de Seguridad
-- Pacientes: Solo el dueño puede ver y editar
create policy "Users can only access their own patients" 
on public.patients for all using (auth.uid() = user_id);

-- Historias Clínicas: Solo el doctor puede ver y editar
create policy "Doctors can only access their own clinical records" 
on public.clinical_records for all using (auth.uid() = doctor_id);

-- Medicamentos: Vinculados a la historia clínica que el doctor posee
create policy "Doctors can only access medications of their records"
on public.medications for all using (
    exists (
        select 1 from clinical_records 
        where clinical_records.id = medications.record_id 
        and clinical_records.doctor_id = auth.uid()
    )
);

-- Citas: Solo el doctor puede ver y editar sus citas
create policy "Doctors can only access their own appointments" 
on public.appointments for all using (auth.uid() = doctor_id);

-- 5. Tabla de Radiografías
create table public.radiographs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default now() not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    clinical_record_id uuid references public.clinical_records(id) on delete set null,
    image_url text not null,
    type text not null,
    date date not null,
    notes text
);

alter table public.radiographs enable row level security;

-- Radiografías: Solo el doctor del paciente respectivo
create policy "Doctors can only access radiographs of their patients"
on public.radiographs for all using (
    exists (
        select 1 from patients 
        where patients.id = radiographs.patient_id 
        and patients.user_id = auth.uid()
    )
);

-- ============================================
-- STORAGE: Bucket "radiographs"
-- ============================================

insert into storage.buckets (id, name, public) 
values ('radiographs', 'radiographs', true)
on conflict (id) do nothing;

create policy "Radiographs are publicly accessible"
on storage.objects for select
using ( bucket_id = 'radiographs' );

create policy "Users can upload radiographs to their folders"
on storage.objects for insert
with check (
    bucket_id = 'radiographs' and auth.uid() is not null
);

create policy "Users can update their radiographs"
on storage.objects for update
using ( bucket_id = 'radiographs' and auth.uid() is not null );

create policy "Users can delete their radiographs"
on storage.objects for delete
using ( bucket_id = 'radiographs' and auth.uid() is not null );

-- Tabla de Odontograma (Seguimiento dental por pieza)
CREATE TABLE public.odontogram (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    tooth_number INTEGER NOT NULL, -- Numeración FDI (11-48)
    status TEXT NOT NULL DEFAULT 'Sano', -- Sano, Caries, Restauración, Endodoncia, Extracción, Prótesis
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS para Odontograma
ALTER TABLE public.odontogram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los doctores pueden ver el odontograma de sus pacientes" 
ON public.odontogram FOR SELECT 
USING (doctor_id = auth.uid());

CREATE POLICY "Los doctores pueden registrar estados en el odontograma" 
ON public.odontogram FOR INSERT 
WITH CHECK (doctor_id = auth.uid());
