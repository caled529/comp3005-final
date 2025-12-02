// console.log("booking.js loaded");

function formatTimeHM(timeStr) {
    const [h, m] = timeStr.split(":");

    const date = new Date();
    date.setHours(h, m, 0, 0);

    //dateObj.toLocaleTimeString([locales[, options]]);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function generateHourlySlots(startStr, endStr) {
    const [starthour] = startStr.split(":").map(Number);
    const [endhour] = endStr.split(":").map(Number);

    const slots = [];
    for (let h = starthour; h < endhour; h++) {
        const hourStr = String(h).padStart(2, "0") + ":00";
        slots.push(hourStr);
    }
    return slots;
}


document.addEventListener("DOMContentLoaded", () => {

    console.log("booking.js loaded!");

    const trainerSelect = document.getElementById("trainer-select");
    const daySelect = document.getElementById("day-select");
    const startSelect = document.getElementById("start-select");
    const endTimeInput = document.getElementById("end-time");

    if (!trainerSelect) {
        console.error("trainer-select not found");
        return;
    }

    window.availability = {};

    trainerSelect.addEventListener("change", async () => {
        const trainerId = trainerSelect.value;
        if (!trainerId) return;

        //fetching availability from backend
        const res = await fetch(`/member/availability/${trainerId}`);
        const data = await res.json();

        console.log("Fetched availability:", data);

        window.availability[trainerId] = {};
        
        //set up using the fetched data from table
         window.availability[trainerId] = data;

        //extracting unique days
        const days = data.map(a => a.day);

        daySelect.innerHTML = `<option disabled selected>-- Select Day --</option>`;
        days.forEach(d => {
            daySelect.innerHTML += `<option value="${d}">${d[0].toUpperCase() + d.slice(1)}</option>`;
        });

        daySelect.disabled = false;
        startSelect.disabled = true;
        endTimeInput.value = "";
    });

    //populating start times
    daySelect.addEventListener("change", () => {
        const day = daySelect.value;
        const trainerId = trainerSelect.value;

        const avail = window.availability[trainerId].find(a => a.day === day);
        const hours = avail?.hours || [];

        startSelect.innerHTML = `<option value="" disabled selected>Select Time</option>`;

        hours.forEach(h => {
            const slot = `${String(h).padStart(2, "0")}:00`;
            const readable = formatTimeHM(slot);

            const opt = document.createElement("option");
            opt.value = slot;
            opt.textContent = readable;
            startSelect.appendChild(opt);
        });

        startSelect.disabled = false;
        endTimeInput.value = "";
    });

    //autofill 
    startSelect.addEventListener("change", () => {
        const [h, m] = startSelect.value.split(":");
        let endHour = Number(h) + 1;
        if (endHour === 24) endHour = 0; 
        endTimeInput.value = String(endHour).padStart(2, "0") + ":" + m;
    });

});
