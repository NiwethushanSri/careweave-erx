import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer } from 'lucide-react';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNo] = useState(`INV-${Date.now().toString().slice(-8)}`);

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(r => {
        setPrescription(r.data.data);
        setItems((r.data.data.medicines || []).map(m => ({
          ...m,
          unit_price: '',
          total: 0,
        })));
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const updatePrice = (i, price) => {
    const updated = [...items];
    updated[i].unit_price = price;
    updated[i].total = (parseFloat(price) || 0) * (updated[i].quantity || 1);
    setItems(updated);
  };

  const subtotal = items.reduce((a, item) => a + (item.total || 0), 0);
  const tax = subtotal * 0; // 0% tax, can be changed
  const grandTotal = subtotal + tax;

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!prescription) return <div className="p-8 text-center text-gray-400">Not found</div>;

  return (
    <div>
      {/* Controls - hidden on print */}
      <div className="print:hidden p-4 flex items-center gap-3 border-b border-gray-100 bg-white">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-xs text-gray-400">Enter unit prices below, then print</p>
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-2xl mx-auto p-8 bg-white" id="invoice">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Rx</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{prescription.pharmacy_name || 'Pharmacy'}</span>
            </div>
            {prescription.pharmacy_address && (
              <p className="text-sm text-gray-500">{prescription.pharmacy_address}</p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-green-700">INVOICE</h1>
            <p className="text-sm text-gray-500 mt-1">No: <span className="font-mono font-semibold text-gray-700">{invoiceNo}</span></p>
            <p className="text-sm text-gray-500">Date: {format(new Date(), 'dd MMM yyyy')}</p>
            <p className="text-sm text-gray-500">Rx: <span className="font-mono text-green-700">{prescription.prescription_code}</span></p>
          </div>
        </div>

        {/* Bill to / From */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bill To (Patient)</p>
            <p className="font-semibold text-gray-900">{prescription.patient_name}</p>
            <p className="text-sm text-gray-600">NIC: {prescription.patient_nic}</p>
            {prescription.patient_mobile && <p className="text-sm text-gray-600">Tel: {prescription.patient_mobile}</p>}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Prescribed By</p>
            <p className="font-semibold text-gray-900">Dr. {prescription.doctor_name}</p>
            <p className="text-sm text-gray-600">SLMC: {prescription.slmc_number}</p>
            {prescription.clinic_name && <p className="text-sm text-gray-600">{prescription.clinic_name}</p>}
            {prescription.diagnosis && <p className="text-sm text-gray-500 mt-1">Dx: {prescription.diagnosis}</p>}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="text-left p-3 rounded-tl-lg">#</th>
              <th className="text-left p-3">Medicine</th>
              <th className="text-left p-3">Dosage</th>
              <th className="text-center p-3">Qty</th>
              <th className="text-right p-3 print:table-cell">Unit Price (Rs.)</th>
              <th className="text-right p-3 rounded-tr-lg">Total (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 text-gray-500">{i + 1}</td>
                <td className="p-3 font-medium">{item.medicine_name}</td>
                <td className="p-3 text-gray-600">{item.dosage}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={e => updatePrice(i, e.target.value)}
                    className="print:hidden w-24 border border-gray-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="hidden print:inline">{parseFloat(item.unit_price || 0).toFixed(2)}</span>
                </td>
                <td className="p-3 text-right font-medium">
                  {item.total > 0 ? `Rs. ${item.total.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm border-t border-gray-100">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm border-t border-gray-100">
              <span className="text-gray-500">Tax (0%)</span>
              <span className="font-medium">Rs. 0.00</span>
            </div>
            <div className="flex justify-between py-3 text-base font-bold border-t-2 border-green-600 mt-1">
              <span>Grand Total</span>
              <span className="text-green-700">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border border-gray-200 rounded-lg p-4 mb-8 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Notes</p>
          <p>• This invoice is generated based on prescription {prescription.prescription_code}</p>
          <p>• Medicines dispensed as per doctor's instructions only</p>
          <p>• Please keep this invoice for your records</p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-xs text-gray-400">
          <p>CareWeave eRx · Digital Prescription Platform</p>
          <p>Developed by Niwethushan · Forge9x</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          input { display: none !important; }
        }
      `}</style>
    </div>
  );
}
