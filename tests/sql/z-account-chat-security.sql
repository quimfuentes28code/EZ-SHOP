-- Continue from the media suite's fictional owner A, owner B and customer.
reset role;
update public.organizations set published=true where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

set role authenticated;
set request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
insert into public.conversations(id,organization_id,customer_id,customer_display_name) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '22222222-2222-4222-8222-222222222222','Forged name');
select test.assert_true((select customer_id=auth.uid() and customer_display_name='Customer'
 from public.conversations where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
 'Conversation creation derives customer identity from authenticated context');
insert into public.conversation_messages(conversation_id,sender_id,actor_role,body) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'customer','A customer message');
select test.expect_denied($statement$insert into public.conversation_messages(conversation_id,sender_id,actor_role,body)
 values('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'business','Forged business reply')$statement$,
 'Customer cannot send messages under the business context');
insert into storage.objects(bucket_id,name,owner_id) values
 ('autonoservice-private-chat','cccccccc-cccc-4ccc-8ccc-cccccccccccc/attachment.pdf',auth.uid()::text);
select test.assert_true((select count(*)=1 from storage.objects where bucket_id='autonoservice-private-chat'),
 'Customer can upload and read an attachment in its own conversation');
insert into public.conversation_read_states(conversation_id,user_id,actor_role,read_at) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'customer','2026-10-29T10:00:00Z')
 on conflict(conversation_id,user_id,actor_role) do update set
 conversation_id=excluded.conversation_id,user_id=excluded.user_id,actor_role=excluded.actor_role,read_at=excluded.read_at;
insert into public.conversation_read_states(conversation_id,user_id,actor_role,read_at) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'customer','2026-10-29T11:00:00Z')
 on conflict(conversation_id,user_id,actor_role) do update set
 conversation_id=excluded.conversation_id,user_id=excluded.user_id,actor_role=excluded.actor_role,read_at=excluded.read_at;
select test.assert_true((select read_at='2026-10-29T11:00:00Z'::timestamptz
 from public.conversation_read_states where conversation_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
 'Repeated read-state upserts work under the client role');

reset role;
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select test.assert_true((select count(*)=0 from public.conversations),
 'Another business owner cannot read the conversation');
select test.assert_true((select count(*)=0 from public.conversation_messages),
 'Another business owner cannot read its messages');
select test.assert_true((select count(*)=0 from storage.objects where bucket_id='autonoservice-private-chat'),
 'Another business owner cannot read private conversation attachments');
select test.expect_denied($statement$insert into storage.objects(bucket_id,name)
 values('autonoservice-private-chat','cccccccc-cccc-4ccc-8ccc-cccccccccccc/foreign.pdf')$statement$,
 'Another business owner cannot upload into the private conversation');
select test.assert_true((select count(*)=0 from public.conversation_read_states),
 'Read-state cursors remain private to their user');

reset role;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
insert into public.conversation_messages(conversation_id,sender_id,actor_role,body) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'business','A business reply');
select test.assert_true((select count(*)=2 from public.conversation_messages),
 'The business owner can reply and read both conversation messages');
insert into public.conversation_messages(conversation_id,sender_id,actor_role,body,created_at) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'business','Future timestamp attempt','2099-01-01T00:00:00Z');
select test.assert_true((select created_at<=clock_timestamp() and created_at>=clock_timestamp()-interval '10 seconds'
 from public.conversation_messages where body='Future timestamp attempt'),
 'An API client cannot move message order or read cursors into the future');
insert into public.conversation_messages(conversation_id,sender_id,actor_role,body,created_at) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid(),'business','Past timestamp attempt','2000-01-01T00:00:00Z');
select test.assert_true((select created_at>=clock_timestamp()-interval '10 seconds'
 from public.conversation_messages where body='Past timestamp attempt'),
 'An API client cannot insert a new message into past history');
select test.assert_true((select count(*)=1 from storage.objects where bucket_id='autonoservice-private-chat'),
 'The business participant can read the private attachment');
select test.expect_denied($statement$update public.organizations
 set owner_id='22222222-2222-4222-8222-222222222222'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$statement$,
 'Visual identity grants do not allow changing business ownership');
insert into public.account_types(user_id,account_type) values(auth.uid(),'customer');
select test.assert_true((select count(*)=2 from public.account_types),
 'The same identity can enable both business and customer spaces');
select test.expect_denied($statement$insert into public.account_types(user_id,account_type)
 values('22222222-2222-4222-8222-222222222222','customer')$statement$,
 'A user cannot enable a workspace on another identity');

reset role;
set role anon;
set request.jwt.claim.sub='';
select test.expect_denied('select * from public.conversations',
 'Anonymous clients cannot read private conversations');
select test.assert_true((select count(*)=0 from storage.objects where bucket_id='autonoservice-private-chat'),
 'Anonymous clients cannot read private chat attachments');
reset role;
