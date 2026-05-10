-- Migration untuk menambahkan kolom encryption_salt ke tabel users
alter table users
add column if not exists encryption_salt text;

-- Ubah tipe kolom di investments untuk menyimpan ciphertext (string)
-- Catatan: Jalankan ini hanya jika belum ada data, atau backup terlebih dahulu!

-- alter table investments
-- alter column initial_amount type text using initial_amount::text;
--
-- alter table investments
-- alter column current_value type text using current_value::text;
--
-- alter table investments
-- alter column monthly_return type text using monthly_return::text;
--
-- alter table investments
-- alter column notes type text using notes::text;
