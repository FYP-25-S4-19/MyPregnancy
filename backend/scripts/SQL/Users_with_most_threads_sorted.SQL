SELECT creator_id, COUNT(*) AS thread_count 
FROM community_threads
GROUP BY creator_id
ORDER BY thread_count DESC