const db = require('./utils/db');

async function fixSurajAmount() {
  try {
    const surajSubtotal = 4249.39;
    const surajGst = 217.38;
    const surajTotal = 4467.00;

    const result = await db('purchases').where({ invoice_number: 'SA-03833' }).update({
      subtotal: surajSubtotal,
      gst_amount: surajGst,
      total_amount: surajTotal
    });
    console.log(`Updated Suraj Agencies invoice SA-03833 amounts. Rows affected: ${result}`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating purchase:', error);
    process.exit(1);
  }
}

fixSurajAmount();
