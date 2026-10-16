-- Private buckets. Object access stays denied until feature-specific policies
-- and upload validation are introduced in Phases 3 and 4.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('student-photos','student-photos',false,5242880,array['image/jpeg','image/png','image/webp']),
('assignment-files','assignment-files',false,10485760,array['application/pdf','image/jpeg','image/png']);
