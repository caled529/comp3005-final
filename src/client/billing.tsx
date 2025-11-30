import { useEffect, useState } from "react";

export default function BillingPage() {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState<number | null>(null);

    const [ptItems, setPtItems] = useState([]);
    const [groupItems, setGroupItems] = useState([]);

    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    const [total, setTotal] = useState(0);

    // Fetch all members on load
    useEffect(() => {
        fetch("/billing")
            .then(res => res.json())
            .then(data => setMembers(data.members));
    }, []);

    // Fetch PT + group classes when member changes
    useEffect(() => {
        if (!selectedMember) return;

        fetch(`/billing/pt?memberId=${selectedMember}`)
            .then(res => res.json())
            .then(data => setPtItems(data.items));

        fetch(`/billing/group?memberId=${selectedMember}`)
            .then(res => res.json())
            .then(data => setGroupItems(data.items));
    }, [selectedMember]);

    // Update total whenever selected items change
    useEffect(() => {
        setTotal(selectedItems.reduce((sum, item) => sum + item.price, 0));
    }, [selectedItems]);

    const toggleItem = (item: any) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id && i.date === item.date);
            if (exists) {
                return prev.filter(i => !(i.id === item.id && i.date === item.date));
            }
            return [...prev, item];
        });
    };

    const submitInvoice = () => {
        fetch("/billing/invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                memberId: selectedMember,
                lineItems: selectedItems
            })
        })
            .then(res => res.json())
            .then(data => {
                alert("Invoice submitted. Total: $" + data.total);
            });
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Billing</h1>

            {/* Member Selector */}
            <label>Select Member: </label>
            <select
                value={selectedMember ?? ""}
                onChange={(e) => setSelectedMember(Number(e.target.value))}
            >
                <option value="">-- Choose Member --</option>
                {members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>
                        {m.user.name}
                    </option>
                ))}
            </select>

            {/* PT Items */}
            {selectedMember && (
                <>
                    <h2>PT Sessions</h2>
                    {ptItems.map((item: any) => (
                        <div key={item.id}>
                            <input
                                type="checkbox"
                                checked={selectedItems.some(i => i.id === item.id && i.date === item.date)}
                                onChange={() => toggleItem(item)}
                            />
                            {item.description} — ${item.price}
                        </div>
                    ))}

                    <h2>Group Classes</h2>
                    {groupItems.map((item: any) => (
                        <div key={item.id}>
                            <input
                                type="checkbox"
                                checked={selectedItems.some(i => i.id === item.id && i.date === item.date)}
                                onChange={() => toggleItem(item)}
                            />
                            {item.description} — ${item.price}
                        </div>
                    ))}

                    <h2>Invoice Preview</h2>
                    {selectedItems.map((item: any, idx) => (
                        <div key={idx}>
                            {item.description} — ${item.price}
                        </div>
                    ))}

                    <h3>Total: ${total}</h3>

                    <button onClick={submitInvoice}>Submit Invoice</button>
                </>
            )}
        </div>
    );
}