import { databases, account } from "@/lib/appwrite"
import { ID, Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const INSTALLMENT_COLLECTION = "student_installments"
const STUDENT_COLLECTION = "student_admissions"

export const addInstallment = async (student, amount, method) => {
  try {
    const user = await account.get()

    // ✅ Get franchise
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", user.email)]
    )

    const franchiseId = franchiseRes.documents[0].$id

    // ✅ Save installment
    await databases.createDocument(
      DATABASE_ID,
      INSTALLMENT_COLLECTION,
      ID.unique(),
      {
        studentId: student.$id,
        franchiseId, // 🔥 REQUIRED FOR CHART
        amount: Number(amount),
        method,
        date: new Date().toISOString(),
      }
    )

    // ✅ Update student
    const newPaid = (student.feesReceived || 0) + Number(amount)
    const newBalance = student.totalFees - newPaid

    await databases.updateDocument(
      DATABASE_ID,
      STUDENT_COLLECTION,
      student.$id,
      {
        feesReceived: newPaid,
        balance: newBalance,
      }
    )

    return { success: true }

  } catch (err) {
    console.error(err)
    return { success: false }
  }
}