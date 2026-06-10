import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  ref,
  push,
  onValue,
  remove,
  update,
} from "firebase/database";
import toast, {
  Toaster,
} from "react-hot-toast";
import { FiTrash2, FiEdit2 } from "react-icons/fi";

const Expenses = () => {
  const [title, setTitle] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [expenseDate, setExpenseDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  const [expenses, setExpenses] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  // Fetch Expenses
  useEffect(() => {
    const expenseRef = ref(
      db,
      "expenses"
    );

    onValue(expenseRef, (
      snapshot
    ) => {
      const data =
        snapshot.val();

      if (data) {
        const loadedExpenses =
          Object.keys(data).map(
            (key) => ({
              id: key,
              ...data[key],
            })
          );

        setExpenses(
          loadedExpenses.reverse()
        );
      } else {
        setExpenses([]);
      }
    });
  }, []);

  // Add Expense
  const handleExpense =
    async (e) => {
      e.preventDefault();

      if (
        !title ||
        !amount ||
        !expenseDate
      ) {
        toast.error(
          "Please fill all fields"
        );
        return;
      }

      setLoading(true);

      try {
        const expenseRef = ref(
          db,
          editId ? `expenses/${editId}` : "expenses"
        );

        if (editId) {
          await update(expenseRef, {
            title,
            amount: Number(amount),
            expenseDate,
          });
          toast.success("Expense Updated");
          setEditId(null);
        } else {
          await push(
            expenseRef,
            {
              title,
              amount: Number(amount),
              expenseDate,
              date: new Date().toLocaleDateString(),
              createdAt: Date.now(),
            }
          );
          toast.success("Expense Added");
        }

        setTitle("");
        setAmount("");
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        setExpenseDate(new Date(d.getTime() - offset).toISOString().split('T')[0]);
      } catch (error) {
        toast.error(
          editId ? "Failed to update expense" : "Failed to add expense"
        );
        console.log(error);
      }

      setLoading(false);
    };

  // Handle Edit
  const handleEdit = (expense) => {
    setTitle(expense.title);
    setAmount(expense.amount);
    if (expense.expenseDate) {
      setExpenseDate(expense.expenseDate);
    } else if (expense.createdAt) {
      const d = new Date(expense.createdAt);
      const offset = d.getTimezoneOffset() * 60000;
      setExpenseDate(new Date(d.getTime() - offset).toISOString().split('T')[0]);
    } else {
      setExpenseDate("");
    }
    setEditId(expense.id);
  };

  // Delete Expense
  const deleteExpense = async (id) => {
  try {
    const expenseRef = ref(
      db,
      `expenses/${id}`
    );

    await remove(expenseRef);

    toast.success(
      "Expense Deleted"
    );
  } catch (error) {
    console.log(error);

    toast.error(
      "Delete Failed"
    );
  }
};

  // Total Expense
  const totalExpense =
    expenses.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Toaster />

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Expenses
          </h1>

          <p className="text-gray-500">
            Track business expenses
          </p>
        </div>

        {/* Add Expense Form */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <form
            onSubmit={handleExpense}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <input
              type="text"
              placeholder="Expense Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4"
              required
            />

            <input
              type="number"
              placeholder="Amount (₹) *"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4"
              required
            />

            <input 
              type="date" 
              value={expenseDate} 
              onChange={(e) => setExpenseDate(e.target.value)} 
              className="w-full bg-gray-50 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4" 
              required 
            />

            <div className="flex gap-2 w-full">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#111] text-[#D4AF37] rounded-2xl px-6 py-4 font-bold flex-1 hover:bg-black transition-colors shadow-lg disabled:opacity-70 text-sm"
              >
                {loading
                  ? "Saving..."
                  : editId
                  ? "Update"
                  : "Add Expense"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setTitle("");
                    setAmount("");
                    const d = new Date();
                    const offset = d.getTimezoneOffset() * 60000;
                    setExpenseDate(new Date(d.getTime() - offset).toISOString().split('T')[0]);
                  }}
                  className="bg-gray-100 text-gray-600 rounded-2xl px-6 py-4 font-bold flex-1 hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Total Expense */}
        <div className="bg-black text-white rounded-3xl p-6 mb-6">
          <p className="text-gray-300">
            Total Expenses
          </p>

          <h2 className="text-4xl font-bold text-white mt-2">
            ₹
            {totalExpense}
          </h2>
        </div>

        {/* Expense List */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 text-left">
                    Title
                  </th>

                  <th className="p-4 text-left">
                    Amount
                  </th>

                  <th className="p-4 text-left">
                    Date
                  </th>

                  <th className="p-4 text-left">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {expenses.map(
                  (
                    expense
                  ) => (
                    <tr
                      key={
                        expense.id
                      }
                      className="border-b"
                    >
                      <td className="p-4">
                        {
                          expense.title
                        }
                      </td>

                      <td className="p-4 font-semibold">
                        ₹
                        {
                          expense.amount
                        }
                      </td>

                      <td className="p-4">
                        {
                          expense.expenseDate
                            ? expense.expenseDate.split('-').reverse().join('/')
                            : expense.date
                        }
                      </td>

                      <td className="p-4 flex gap-4">
                        <button
                          onClick={() =>
                            handleEdit(expense)
                          }
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() =>
                            deleteExpense(
                              expense.id
                            )
                          }
                          className="text-red-500"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Expenses;