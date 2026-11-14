update public.cms_page_content
set content = jsonb_set(
  content,
  '{mission}',
  coalesce(content->'mission', '{}'::jsonb) || '{
    "evangelism": "To spread the gospel to every people, tribe, or nation.",
    "evangelismReference": "Isaiah 61:1",
    "worship": "To create a conducive environment for people to worship and help individuals realize the fruits of worship through devotions, music, and other expressions.",
    "worshipReference": "Psalm 149:3",
    "discipleship": "To train children, youth, and elders in the knowledge of Christ and spiritual maturity through Bible exposition, as the church expands with upheld Bible doctrines and disciplines.",
    "discipleshipReference": "Proverbs 1:7",
    "missions": "To give hope through charity, education, and sports, while developing talents and skills in music, dance, drama, art and design, hairdressing, baking, catering, shoemaking, decoration, and tailoring. The church also plans to buy land and build a Bible college.",
    "missionsReference": ""
  }'::jsonb,
  true
)
where page_key = 'about';
