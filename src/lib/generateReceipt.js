import jsPDF from "jspdf"

export const generateReceipt = (student, item) => {
  const doc = new jsPDF()

  doc.text("Payment Receipt", 70, 20)
  doc.text(`Student: ${student.studentName}`, 20, 40)
  doc.text(`Amount: ₹${item.amount}`, 20, 60)
  doc.text(`Method: ${item.method}`, 20, 70)
  doc.text(`Date: ${new Date(item.date).toLocaleDateString()}`, 20, 80)

  doc.save(`receipt_${student.studentName}.pdf`)
}