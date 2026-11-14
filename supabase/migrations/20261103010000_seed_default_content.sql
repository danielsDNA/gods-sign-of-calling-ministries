insert into public.site_settings (key, value) values
  ('church_name', 'God''s Sign of Calling Revival Ministries'),
  ('tagline', 'Reviving lives. Serving communities. Proclaiming the Kingdom.'),
  ('address', 'Entebbe–Bwebajja, Uganda'),
  ('phone', '0705538564'),
  ('email', ''),
  ('hero_welcome', 'God''s Sign of Calling Revival Ministries'),
  ('hero_headline', 'A Place to Belong. A Calling to Serve.'),
  ('hero_subheading', 'A born-again Christian ministry based in Entebbe–Bwebajja, Uganda. We follow Jesus by serving people, strengthening communities, and sharing the good news of the Kingdom.'),
  ('hero_cta_primary_label', 'Join Us Sunday'),
  ('hero_cta_primary_href', '#service-times'),
  ('hero_cta_secondary_label', 'Explore Our Ministries'),
  ('hero_cta_secondary_href', '/ministries'),
  ('hero_photo_url', '/airo-assets/images/pages/home/about-community'),
  ('is_live', 'false'),
  ('live_stream_url', ''),
  ('about_heading', 'Called to Revival. Rooted in Service.'),
  ('about_body', E'Established in 2017, God''s Sign of Calling Revival Ministries is a born-again Christian church and registered non-governmental organization based at its headquarters in Entebbe–Bwebajja, Uganda.\n\nThe ministry serves communities through branches in Busia, Lira, Wobulenzi, Kaunga, and Wamala. Its calling is grounded in Psalm 27 and in following Jesus through practical care for people.\n\nWe believe in building a healthy, united community and serving the children of God in every way we can—working with the poor, promoting human transformation, and sharing the good news of God''s Kingdom.'),
  ('about_mission', 'To follow our Lord and Savior Jesus Christ in working with the poor, promoting human transformation, and bearing witness to the good news of the Kingdom of God.'),
  ('about_vision', 'Establishing the Kingdom of God locally, nationally, and globally.'),
  ('scripture_text', 'The Lord is my light and my salvation—whom shall I fear?'),
  ('scripture_reference', 'Psalm 27:1'),
  ('map_address', 'Entebbe–Bwebajja, Uganda'),
  ('stay_connected_enabled', 'true'),
  ('contact_notification_email', '')
on conflict (key) do nothing;

insert into public.hero_phrases (phrase, sort_order, active)
select defaults.phrase, defaults.sort_order, true
from (values
  ('Rooted in Psalm 27', 0),
  ('Serving Our Communities', 1),
  ('Growing Together in Faith', 2),
  ('Proclaiming the Good News', 3),
  ('A Place to Belong', 4)
) as defaults(phrase, sort_order)
where not exists (select 1 from public.hero_phrases);

insert into public.service_times (day, time, label, location, sort_order, active)
select defaults.day, defaults.time, defaults.label, '', defaults.sort_order, true
from (values
  ('Sunday', '8:00 AM – 10:00 AM', 'Morning Service', 0),
  ('Sunday', '10:00 AM – 3:00 PM', 'Main Service', 1),
  ('Sunday', '4:00 PM – 6:00 PM', 'Ministers'' Service', 2),
  ('Tuesday', '5:00 PM – 9:30 PM', 'Financial Breakthrough', 3),
  ('Thursday', '5:00 PM – 9:30 PM', 'Deliverance Service', 4),
  ('Saturday', '2:00 PM', 'Counselling', 5),
  ('2nd Friday of every month', 'Overnight', 'Overnight Prayer', 6)
) as defaults(day, time, label, sort_order)
where not exists (select 1 from public.service_times);

insert into public.cms_page_content (page_key, content) values
  ('about', '{
    "hero":{"eyebrow":"Our story","heading":"Called to Revival. Rooted in Service.","subheading":"God''s Sign of Calling Revival Ministries is a born-again Christian church and registered non-governmental organization, headquartered in Entebbe–Bwebajja, Uganda."},
    "story":{"heading":"A Ministry Serving God''s People","body":[
      {"id":"p1","text":"Established in 2014, God''s Sign of Calling Revival Ministries is a born-again Christian church and registered non-governmental organization based at its headquarters in Entebbe–Bwebajja, Uganda."},
      {"id":"p2","text":"The ministry serves communities through branches in Busia, Lira, Wobulenzi, Kaunga, and Wamala. Its calling is grounded in Psalm 27 and in following Jesus through practical care for people."},
      {"id":"p3","text":"We believe in building a healthy, united community and serving the children of God in every way we can—working with the poor, promoting human transformation, and sharing the good news of God''s Kingdom."}
    ]},
    "mission":{"heading":"Following Jesus in Service","statement":"To follow our Lord and Savior Jesus Christ in working with the poor, promoting human transformation, and bearing witness to the good news of the Kingdom of God.","description":"Our ministry puts faith into action through compassion, service, and the good news of God''s Kingdom."},
    "vision":{"heading":"A Kingdom Without Borders","statement":"Establishing the Kingdom of God locally, nationally, and globally.","description":"We serve from our headquarters in Entebbe–Bwebajja and our branches across Uganda, with a heart for communities everywhere."},
    "values":[
      {"id":"v1","icon":"Heart","title":"Family","description":"We welcome and care for people as one family in Christ, serving one another with love and respect."},
      {"id":"v2","icon":"Users","title":"Diversity","description":"We bring people and communities together, honoring each person as we work toward unity in Christ."},
      {"id":"v3","icon":"Star","title":"Professionalism","description":"We serve with care, responsibility, and excellence in every ministry and community programme."},
      {"id":"v4","icon":"Users","title":"Communication","description":"We value honest, respectful communication that builds understanding and strengthens our community."},
      {"id":"v5","icon":"Globe","title":"Success","description":"We measure success by faithful service, transformed lives, and the growth of God''s Kingdom."},
      {"id":"v6","icon":"BookOpen","title":"Integrity","description":"We seek to keep our word and act with honesty, humility, and faithfulness before God and one another."}
    ],
    "stats":[
      {"id":"st1","value":"2014","label":"Founded"},
      {"id":"st2","value":"5+","label":"Branches across Uganda"},
      {"id":"st3","value":"NGO","label":"Registered in Uganda"},
      {"id":"st4","value":"Psalm 27","label":"Scripture foundation"}
    ],
    "team":[],
    "scripture":{"text":"The Lord is my light and my salvation—whom shall I fear?","reference":"Psalm 27:1"},
    "cta":{"heading":"Come and Worship With Us","body":"Join us at our Entebbe–Bwebajja headquarters or connect with one of our branches in Busia, Lira, Wobulenzi, Kaunga, or Wamala. There is a place for you in our community."}
  }'::jsonb),
  ('ministries', '{
    "intro":"We follow Jesus by serving people, supporting children, working with the poor, and building a healthy, united community. Find a programme below or contact us to learn how to take part.",
    "scripture":{"text":"The Lord is my light and my salvation—whom shall I fear?","reference":"Psalm 27:1"},
    "volunteerCta":{"heading":"Find a Way to Serve","body":"Contact God''s Sign of Calling Revival Ministries to learn more about the weekly programmes and ways to support children and communities.","buttonLabel":"Get in Touch","buttonHref":"/contact"},
    "ministries":[
      {"id":"m1","name":"Children & Family Support","slug":"children-family-support","description":"We are committed to serving the children of God and strengthening families with care, welcome, and practical support.","imageSlot":"ministry/children","leader":{"name":"","title":"","photoSlot":""},"meetingDay":"","meetingTime":"","audience":"Children & families"},
      {"id":"m2","name":"Community Health & Unity","slug":"community-health-unity","description":"We believe in a healthy, unified community and seek to contribute to the wellbeing and transformation of the people we serve.","imageSlot":"ministry/outreach-missions","leader":{"name":"","title":"","photoSlot":""},"meetingDay":"","meetingTime":"","audience":"Everyone"},
      {"id":"m3","name":"Prayer & Deliverance","slug":"prayer-deliverance","description":"Gather with us in prayer and worship as we seek God together. Our Thursday Deliverance Service is part of the weekly programme.","imageSlot":"ministry/prayer","leader":{"name":"","title":"","photoSlot":""},"meetingDay":"Thursday","meetingTime":"5:00 PM – 9:30 PM","audience":"Everyone"},
      {"id":"m4","name":"Financial Breakthrough","slug":"financial-breakthrough","description":"Join our Tuesday service for prayer and encouragement as we seek God''s help and renewal in every area of life.","imageSlot":"ministry/worship-music","leader":{"name":"","title":"","photoSlot":""},"meetingDay":"Tuesday","meetingTime":"5:00 PM – 9:30 PM","audience":"Everyone"},
      {"id":"m5","name":"Counselling & Care","slug":"counselling-care","description":"A time for counsel, prayer, and compassionate support. Our weekly counselling programme meets on Saturday afternoons.","imageSlot":"ministry/hospitality","leader":{"name":"","title":"","photoSlot":""},"meetingDay":"Saturday","meetingTime":"2:00 PM","audience":"Everyone"}
    ]
  }'::jsonb),
  ('sermons', '{"intro":"There are currently no sermons available. You can request prayer or reach out to us through our contact page.","sermons":[],"series":[],"speakers":[]}'::jsonb),
  ('events', '{"categories":["All","Conference","Prayer","Community","Youth","Women","Men"]}'::jsonb),
  ('contact', '{"topics":["General Inquiry","Prayer Request","Membership","Volunteering","Events","Pastoral Care","Other"]}'::jsonb),
  ('gallery', '{"intro":"Moments from our church family and community.","categories":["All","General"],"photos":[]}'::jsonb),
  ('home', '{"sermons":[],"galleryImages":[]}'::jsonb)
on conflict (page_key) do nothing;
