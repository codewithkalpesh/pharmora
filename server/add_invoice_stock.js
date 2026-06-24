const db = require('./utils/db');

const itemsData = [
  { name: 'DANISH BEATON STRIP TAB', batch: 'DBN26008', exp: '2029-02-28', qty: 6, mrp: 8.00, rate: 1.65 },
  { name: 'GRAIN GOLD AMP.', batch: 'GG-64', exp: '2028-03-31', qty: 5, mrp: 200.00, rate: 3.50 },
  { name: 'LOMMO TAB', batch: 'GTCRY2142', exp: '2028-02-29', qty: 8, mrp: 2.50, rate: 0.85 },
  { name: 'STICKOBAND', batch: '320', exp: '2029-02-28', qty: 1, mrp: 150.00, rate: 55.00 },
  { name: 'GLUETRAP ECO (SMALL)', batch: 'BATCH-SMALL', exp: '2030-12-31', qty: 2, mrp: 0.00, rate: 24.00 },
  { name: 'GLUETRAP ECO (LARGE)', batch: 'BATCH-LARGE', exp: '2030-12-31', qty: 2, mrp: 0.00, rate: 40.00 },
  { name: 'WOVEN FABR OF COTTON 2**5MT', batch: '69', exp: '2030-12-31', qty: 1, mrp: 150.00, rate: 39.00 },
  { name: 'WOVEN FEBR OF COTTON 3**5MT', batch: '72', exp: '2030-12-31', qty: 1, mrp: 225.00, rate: 59.00 },
  { name: 'ZAROOR (SMAL) 3\'S', batch: 'B65049', exp: '2027-08-31', qty: 10, mrp: 10.00, rate: 8.80 },
  { name: 'CLOBET GM RC CREAM', batch: '012639', exp: '2027-12-31', qty: 1, mrp: 45.00, rate: 9.00 },
  { name: 'DERMI 5+ CREAM 15GM', batch: 'C2610385', exp: '2028-02-29', qty: 3, mrp: 51.05, rate: 14.00 },
  { name: 'MELAMET CREAM', batch: 'C2610865', exp: '2028-02-29', qty: 2, mrp: 79.88, rate: 21.00 },
  { name: 'SMILOGEL CREAM (NEW MRP)', batch: 'D260395', exp: '2028-03-31', qty: 1, mrp: 36.15, rate: 14.00 },
  { name: 'SMILOGEL CT', batch: 'C2610255', exp: '2028-02-29', qty: 2, mrp: 33.89, rate: 11.80 },
  { name: 'OMEE *D* CAP', batch: '25860519', exp: '2027-11-30', qty: 5, mrp: 206.25, rate: 27.90 },
  { name: 'OMEE CAP. (20CAP)', batch: '25860127', exp: '2027-10-31', qty: 8, mrp: 61.32, rate: 22.00 },
  { name: 'PLAYGARD CONDOM CHOCLATE', batch: 'DN260111', exp: '2028-12-31', qty: 18, mrp: 30.00, rate: 25.00 },
  { name: 'SUMO 15GM', batch: 'SB011F', exp: '2027-10-31', qty: 1, mrp: 76.88, rate: 16.20 },
  { name: 'SUMO 30GM', batch: 'SD011G', exp: '2027-12-31', qty: 1, mrp: 154.69, rate: 22.70 },
  { name: 'ORS INSTA(ORANGE)', batch: 'FAJO60111', exp: '2027-06-30', qty: 4, mrp: 31.50, rate: 14.25 },
  { name: 'ALKOF COLD &FLU TAB.', batch: 'T60077A', exp: '2027-12-31', qty: 5, mrp: 92.75, rate: 15.65 },
  { name: 'COLLEGIAN CREAM', batch: '13', exp: '2027-12-31', qty: 2, mrp: 99.00, rate: 60.00 },
  { name: 'ACENEXT MR TAB', batch: 'PI25043', exp: '2027-08-31', qty: 2, mrp: 115.00, rate: 15.00 },
  { name: 'ACENEXT SP A/A', batch: 'PI26011', exp: '2028-01-31', qty: 11, mrp: 111.05, rate: 15.25 },
  { name: 'LEVOZET TAB.', batch: 'PC25024', exp: '2028-10-31', qty: 8, mrp: 52.68, rate: 2.85 },
  { name: 'ORS POWDER [O] CADILA', batch: 'COG26017', exp: '2028-03-31', qty: 6, mrp: 22.66, rate: 4.55 },
  { name: 'SKINSHINE 15GM', batch: 'E25925', exp: '2027-10-31', qty: 2, mrp: 154.55, rate: 41.00 },
  { name: 'AMLIP AT TAB', batch: '6C10098', exp: '2028-01-31', qty: 4, mrp: 90.58, rate: 10.60 },
  { name: 'AZICIP 250 TAB', batch: '5C11441', exp: '2028-10-31', qty: 4, mrp: 74.78, rate: 37.00 },
  { name: 'AZICIP 500 TAB[DPCO]', batch: '5N40715', exp: '2028-09-30', qty: 4, mrp: 75.53, rate: 36.60 },
  { name: 'BURNHEAL CREAM', batch: '5Q668', exp: '2027-08-31', qty: 2, mrp: 92.95, rate: 27.55 },
  { name: 'CHESTON COLD TAB WHITE', batch: 'CIA26014', exp: '2027-02-28', qty: 5, mrp: 70.18, rate: 21.00 },
  { name: 'COFSIL DROP (200 LONG)', batch: 'CA2535903', exp: '2027-05-31', qty: 1, mrp: 190.65, rate: 114.00 },
  { name: 'MOVEXX SP TAB', batch: 'AMQ101AKA', exp: '2027-01-31', qty: 3, mrp: 119.78, rate: 27.55 },
  { name: 'OKACET L TAB', batch: 'AMQ34AWA1', exp: '2027-02-28', qty: 8, mrp: 71.12, rate: 5.05 },
  { name: 'ENDOPAR TAB', batch: 'ET260201', exp: '2029-02-28', qty: 4, mrp: 30.94, rate: 6.90 },
  { name: 'INTAGESIC MR TAB', batch: 'INP25CT87', exp: '2027-11-30', qty: 3, mrp: 116.00, rate: 15.40 },
  { name: 'NIMUCET TAB', batch: 'IPL25711', exp: '2028-10-31', qty: 4, mrp: 60.00, rate: 7.25 },
  { name: 'K COLD TAB BLUE', batch: 'T60002', exp: '2027-12-31', qty: 5, mrp: 60.00, rate: 6.00 },
  { name: 'DAINAPAR TAB', batch: 'AMT-2350', exp: '2027-09-30', qty: 4, mrp: 28.13, rate: 6.20 },
  { name: 'MOUTH HEAL TAB', batch: '25AT-01', exp: '2030-12-31', qty: 20, mrp: 10.00, rate: 6.85 },
  { name: 'SAPAT DR.SKIN MALAM', batch: 'SMA2603', exp: '2029-02-28', qty: 3, mrp: 35.00, rate: 27.78 },
  { name: 'KAYAM CHURNA [S]', batch: '74181', exp: '2027-11-30', qty: 1, mrp: 59.00, rate: 46.33 },
  { name: 'KANTH SUDHARAK VATI', batch: '14/25-26', exp: '2028-10-31', qty: 6, mrp: 10.00, rate: 7.94 },
  { name: 'AB COTTON WOOL[I.P]', batch: '970', exp: '2029-04-30', qty: 3, mrp: 187.50, rate: 68.00 },
  { name: 'AB COTTON WOOL*100[I.P]GROSS', batch: '920', exp: '2028-11-30', qty: 3, mrp: 14.06, rate: 4.90 },
  { name: 'FLUKA 150 TAB[DPCO]', batch: '5N0843', exp: '2028-11-30', qty: 2, mrp: 12.66, rate: 7.15 },
  { name: 'NICIP PLUS TAB', batch: 'CP60053', exp: '2029-01-31', qty: 10, mrp: 61.03, rate: 11.80 },
  { name: 'NICIP TAB', batch: '5R11253', exp: '2028-07-31', qty: 10, mrp: 40.73, rate: 6.00 },
  { name: 'CIPLADINE OINT 10GM', batch: 'NO251011', exp: '2027-11-30', qty: 2, mrp: 36.22, rate: 21.80 },
  { name: 'COFSIL [O]*RP*(NEW MRP35.00)', batch: '5M60388', exp: '2028-11-30', qty: 11, mrp: 35.63, rate: 20.65 },
  { name: 'OMNIGEL 10GM (NET RATE)', batch: 'H0898', exp: '2027-09-30', qty: 2, mrp: 67.34, rate: 27.50 },
  { name: 'CASTOR NF CREAM.', batch: 'DLWH6032', exp: '2028-03-31', qty: 2, mrp: 103.13, rate: 32.00 },
  { name: 'DIECOLD PLUS TAB', batch: '8026001', exp: '2027-12-31', qty: 4, mrp: 60.00, rate: 15.60 },
  { name: 'KETOFORD DT TAB', batch: 'KEO503L', exp: '2027-11-30', qty: 4, mrp: 56.00, rate: 13.00 },
  { name: 'ORAFAST GEL', batch: 'DLQJ6001', exp: '2027-12-31', qty: 1, mrp: 95.00, rate: 28.25 },
  { name: 'ORAFAST TAB.', batch: '7276001', exp: '2027-09-30', qty: 5, mrp: 40.00, rate: 11.30 },
  { name: 'ACEMIZ PLUS TAB', batch: 'AT-000126', exp: '2027-12-31', qty: 5, mrp: 123.47, rate: 15.00 },
  { name: 'GRAIN GOLD AMP.', batch: 'GG-64', exp: '2028-03-31', qty: 4, mrp: 200.00, rate: 3.50 },
  { name: 'LOMMO TAB', batch: 'GTCRY2142', exp: '2028-02-29', qty: 8, mrp: 2.50, rate: 0.85 },
  { name: 'ORS INSTA(ORANGE)', batch: 'FAJO60111', exp: '2027-06-30', qty: 6, mrp: 31.50, rate: 14.25 },
  { name: 'ACENEXT P TAB', batch: 'PI25058', exp: '2027-09-30', qty: 3, mrp: 65.48, rate: 15.00 },
  { name: 'ACENEXT SP A/A', batch: 'PI25033', exp: '2027-05-31', qty: 3, mrp: 118.45, rate: 15.25 },
  { name: 'DEMISONE 5 TAB', batch: 'JKBH26020', exp: '2029-01-31', qty: 6, mrp: 2.31, rate: 1.52 },
  { name: 'ONVIN 4MG MD TAB', batch: 'PF26004', exp: '2028-02-29', qty: 3, mrp: 1096.20, rate: 5.10 },
  { name: 'CIP ZOX TAB', batch: 'AMQ03BCB1', exp: '2027-12-31', qty: 2, mrp: 83.60, rate: 14.50 },
  { name: 'VINRAL Z ENERGY DRINK', batch: 'VO/068', exp: '2027-03-31', qty: 2, mrp: 53.40, rate: 29.00 },
  { name: 'CASTOR NF CREAM.', batch: 'DLWH6032', exp: '2028-03-31', qty: 2, mrp: 103.13, rate: 30.50 },
  { name: 'ACEMIZ PLUS TAB', batch: 'AT-000126', exp: '2027-12-31', qty: 1, mrp: 123.47, rate: 15.00 }
];

async function seedInvoice() {
  try {
    console.log('Starting invoice import...');

    // 1. Ensure supplier SURAJ AGENCIES exists
    let supplier = await db('suppliers').where({ supplier_name: 'SURAJ AGENCIES' }).first();
    if (!supplier) {
      const [newSupp] = await db('suppliers').insert({
        supplier_name: 'SURAJ AGENCIES',
        gst_number: '27ABFPM6451K1ZC',
        drug_license_number: '20B351479,20D,213492',
        email: 'nmbandhan@gmail.com',
        phone: '9423937138',
        address: 'PLOT NO 104+104A, GROUND+MEZZANINE SHOP, GUJRATHI GALLI, JALGAON'
      }).returning('*');
      supplier = newSupp;
      console.log('Created supplier:', supplier.id);
    } else {
      console.log('Found supplier:', supplier.id);
    }

    const itemsForPurchase = [];

    let subtotal = 0;
    let total_amount = 0;

    // 2. Process each medicine
    for (const item of itemsData) {
      let med = await db('medicines').where('name', item.name).first();
      if (!med) {
        const [newMed] = await db('medicines').insert({
          name: item.name,
          category: 'General',
          purchase_price: item.rate,
          selling_price: item.rate * 1.2, // dummy markup
          mrp: item.mrp,
          gst_rate: 12.0 // dummy default
        }).returning('*');
        med = newMed;
      }

      itemsForPurchase.push({
        medicine_id: med.id,
        batch_number: item.batch,
        expiry_date: item.exp,
        quantity: item.qty,
        purchase_rate: item.rate,
        mrp: item.mrp,
        selling_price: item.mrp,
        gst_rate: 12.0 // Defaulting to 12% for the example
      });

      const lineTotal = item.qty * item.rate;
      subtotal += lineTotal;
      total_amount += lineTotal * 1.12; // with GST
    }

    // 3. Create purchase
    // We will use the same logic as the controller directly with transactions
    const trx = await db.transaction();

    try {
      const invoiceNum = 'SA-03833';
      const [purchase] = await trx('purchases').insert({
        supplier_id: supplier.id,
        invoice_number: invoiceNum,
        invoice_date: '2026-05-23',
        subtotal: subtotal,
        gst_amount: total_amount - subtotal,
        total_amount: total_amount,
        status: 'Completed',
        created_by: null // we don't have a user here
      }).returning('*');

      console.log('Created purchase:', purchase.id);

      for (const item of itemsForPurchase) {
        let batch = await trx('batches').where({ medicine_id: item.medicine_id, batch_number: item.batch_number }).first();
        if (batch) {
          await trx('batches').where({ id: batch.id }).update({
            quantity: batch.quantity + parseInt(item.quantity),
            updated_at: trx.fn.now()
          });
        } else {
          const [newBatch] = await trx('batches').insert({
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            quantity: item.quantity,
            purchase_rate: item.purchase_rate,
            mrp: item.mrp,
            selling_price: item.selling_price
          }).returning('*');
          batch = newBatch;
        }

        const inventory = await trx('inventory').where({ medicine_id: item.medicine_id }).first();
        if (inventory) {
          await trx('inventory').where({ medicine_id: item.medicine_id }).update({
            current_stock: inventory.current_stock + parseInt(item.quantity),
            updated_at: trx.fn.now()
          });
        } else {
          await trx('inventory').insert({
            medicine_id: item.medicine_id,
            current_stock: item.quantity,
            minimum_stock: 10,
            reorder_level: 15
          });
        }

        await trx('purchase_items').insert({
          purchase_id: purchase.id,
          medicine_id: item.medicine_id,
          batch_id: batch.id,
          quantity: item.quantity,
          purchase_rate: item.purchase_rate,
          gst_rate: item.gst_rate,
          total: item.purchase_rate * item.quantity
        });
      }

      await trx.commit();
      console.log('Purchase imported successfully!');
    } catch (err) {
      await trx.rollback();
      console.error('Transaction failed:', err);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedInvoice();
