"""Show a 'Completed' popup when data collection or training finishes."""

def show_completed(message="Completed.", title="Completed"):
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        messagebox.showinfo(title, message)
        root.destroy()
    except Exception:
        print(f"\n>>> {title}: {message}")
