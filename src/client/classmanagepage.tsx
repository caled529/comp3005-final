import { useEffect, useState } from "react";

export default function ClassManagePage() {
    const [ptSessions, setPtSessions] = useState([]);

    // Group class creation states
    const [step, setStep] = useState(1);

    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null);

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

    const [classTypeName, setClassTypeName] = useState("");

    // Load PT sessions on mount
    useEffect(() => {
        fetch("/classmanage/pt")
            .then(res => res.json())
            .then(data => setPtSessions(data.sessions || []));
    }, []);

    // Fetch trainers after Step 1
    const fetchAvailableTrainers = () => {
        fetch(`/classmanage/group/trainer?start=${startTime}&end=${endTime}`)
            .then(res => res.json())
            .then(data => {
                setTrainers(data.trainers || []);
                setStep(2);
            });
    };

    // Fetch rooms after Step 2
    const fetchAvailableRooms = () => {
        fetch(`/classmanage/group/room?start=${startTime}&end=${endTime}&trainerId=${selectedTrainer}`)
            .then(res => res.json())
            .then(data => {
                setRooms(data.rooms || []);
                setStep(3);
            });
    };

    // Submit new class instance
    const createGroupClass = () => {
        fetch("/classmanage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                typeName: classTypeName,
                start: startTime,
                end: endTime,
                trainerId: selectedTrainer,
                roomId: selectedRoom,
            })
        })
            .then(res => res.json())
            .then(() => alert("Class created successfully."));
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Class Management</h1>

            {/* SECTION 1: PT SESSIONS */}
            <h2>PT Sessions Requiring Room Assignment</h2>
            {ptSessions.length === 0 ? (
                <p>No pending PT sessions.</p>
            ) : (
                ptSessions.map((s: any) => (
                    <div key={s.id} style={{ marginBottom: "10px" }}>
                        {s.memberName} with {s.trainerName} — {s.startTime}
                        <button style={{ marginLeft: "10px" }}>
                            Assign Room
                        </button>
                    </div>
                ))
            )}

            <hr />

            {/* SECTION 2: CREATE GROUP CLASS */}
            <h2>Create New Group Class</h2>

            {step === 1 && (
                <div>
                    <label>Class Type Name:</label>
                    <input
                        value={classTypeName}
                        onChange={e => setClassTypeName(e.target.value)}
                    />

                    <br /><br />

                    <label>Date:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />

                    <br /><br />

                    <label>Start Time:</label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                    />

                    <br /><br />

                    <label>End Time:</label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                    />

                    <br /><br />

                    <button onClick={fetchAvailableTrainers}>
                        Next → Choose Trainer
                    </button>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3>Select Trainer</h3>

                    {trainers.map((t: any) => (
                        <div key={t.id}>
                            <input
                                type="radio"
                                name="trainer"
                                value={t.id}
                                onChange={() => setSelectedTrainer(t.id)}
                            />
                            {t.name}
                        </div>
                    ))}

                    <br />

                    <button onClick={fetchAvailableRooms}>
                        Next → Choose Room
                    </button>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3>Select Room</h3>

                    {rooms.map((r: any) => (
                        <div key={r.id}>
                            <input
                                type="radio"
                                name="room"
                                value={r.id}
                                onChange={() => setSelectedRoom(r.id)}
                            />
                            {r.name} (capacity: {r.capacity})
                        </div>
                    ))}

                    <br />

                    <button onClick={createGroupClass}>
                        Create Class
                    </button>
                </div>
            )}
        </div>
    );
}
