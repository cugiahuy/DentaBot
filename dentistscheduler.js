class DentistScheduler {
    constructor(configuration) {
        this.getAvailability = async () => {
            const response = await fetch("https://dental-scheduler.azurewebsites.net/availability");
            const times = await response.json()
            console.log(times)
            let responseText = ""
            times.map(time => {
                responseText += `${time}, `
            })
            return responseText
        }

        this.scheduleAppointment = async (time) => {
            const response = await fetch("https://dental-scheduler.azurewebsites.net/schedule", { method: "post", body: { time: time } })
            let responseText = `${time}.`
            return responseText
        }
    }
}

module.exports = DentistScheduler