// Minimal FormSubmit test — absolute simplest payload
async function test() {
  // Test 1: With the .env email
  console.log('--- Test 1: involtintegrated@gmail.com ---');
  const res1 = await fetch('https://formsubmit.co/ajax/involtintegrated@gmail.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ Name: 'Test', Email: 'test@test.com', Message: 'Hello' }),
  });
  console.log('Status:', res1.status);
  console.log('Body:', await res1.text());

  // Test 2: With the scratch test email
  console.log('\n--- Test 2: lokeshsohanda27@gmail.com ---');
  const res2 = await fetch('https://formsubmit.co/ajax/lokeshsohanda27@gmail.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ Name: 'Test', Email: 'test@test.com', Message: 'Hello' }),
  });
  console.log('Status:', res2.status);
  console.log('Body:', await res2.text());

  // Test 3: FormSubmit's own test address
  console.log('\n--- Test 3: formsubmit test endpoint ---');
  const res3 = await fetch('https://formsubmit.co/ajax/your@email.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ Name: 'Test', Email: 'test@test.com' }),
  });
  console.log('Status:', res3.status);
  console.log('Body:', await res3.text());

  // Test 4: Try form-urlencoded instead of JSON
  console.log('\n--- Test 4: form-urlencoded to involtintegrated ---');
  const res4 = await fetch('https://formsubmit.co/ajax/involtintegrated@gmail.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({ Name: 'Test', Email: 'test@test.com', Message: 'Hello' }),
  });
  console.log('Status:', res4.status);
  console.log('Body:', await res4.text());
}

test();
