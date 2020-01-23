module.exports = {
    create: async function (data) {
        try {
            var _this = this;
            let probeKey;
            if (data.probeKey) {
                probeKey = data.probeKey;
            } else {
                probeKey = uuidv1();
            }
            let storedProbe = await _this.findOneBy({ probeName: data.probeName });
            if (storedProbe && storedProbe.probeName) {
                let error = new Error('Probe name already exists.');
                error.code = 400;
                ErrorService.log('probe.create', error);
                throw error;
            }
            else {
                let probe = new ProbeModel();
                probe.probeKey = probeKey;
                probe.probeName = data.probeName;
                var savedProbe = await probe.save();
                return savedProbe;
            }
        } catch (error) {
            ErrorService.log('ProbeService.create', error);
            throw error;
        }
    },

    updateOneBy: async function (query, data) {
        try {
            if (!query) {
                query = {};
            }

            query.deleted = false;
            var probe = await ProbeModel.findOneAndUpdate(query,
                { $set: data },
                {
                    new: true
                });
            return probe;
        } catch (error) {
            ErrorService.log('ProbeService.updateOneBy', error);
            throw error;
        }
    },

    updateBy: async function (query, data) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted) query.deleted = false;
            var updatedData = await ProbeModel.updateMany(query, {
                $set: data
            });
            updatedData = await this.findBy(query);
            return updatedData;
        } catch (error) {
            ErrorService.log('ProbeService.updateMany', error);
            throw error;
        }
    },

    findBy: async function (query, limit, skip) {
        try {
            if (!skip) skip = 0;

            if (!limit) limit = 0;

            if (typeof (skip) === 'string') {
                skip = parseInt(skip);
            }

            if (typeof (limit) === 'string') {
                limit = parseInt(limit);
            }

            if (!query) {
                query = {};
            }

            query.deleted = false;
            var probe = await ProbeModel.find(query)
                .sort([['createdAt', -1]])
                .limit(limit)
                .skip(skip);
            return probe;
        } catch (error) {
            ErrorService.log('ProbeService.findBy', error);
            throw error;
        }
    },

    findOneBy: async function (query) {
        try {
            if (!query) {
                query = {};
            }

            query.deleted = false;
            var probe = await ProbeModel.findOne(query);
            return probe;
        } catch (error) {
            ErrorService.log('ProbeService.findOneBy', error);
            throw error;
        }
    },

    countBy: async function (query) {
        try {
            if (!query) {
                query = {};
            }

            query.deleted = false;
            var count = await ProbeModel.count(query);
            return count;
        } catch (error) {
            ErrorService.log('ProbeService.countBy', error);
            throw error;
        }
    },

    deleteBy: async function (query) {
        try {
            if (!query) {
                query = {};
            }
            query.deleted = false;
            var probe = await ProbeModel.findOneAndUpdate(query, { $set: { deleted: true, deletedAt: Date.now() } }, { new: true });
            return probe;
        } catch (error) {
            ErrorService.log('ProbeService.deleteBy', error);
            throw error;
        }
    },

    hardDeleteBy: async function (query) {
        try {
            await ProbeModel.deleteMany(query);
            return 'Probe(s) removed successfully!';
        } catch (error) {
            ErrorService.log('ProbeService.hardDeleteBy', error);
            throw error;
        }
    },

    createMonitorLog: async function (data) {
        try {
            let Log = new MonitorLogModel();
            let LogHour = new MonitorLogByHourModel();
            let LogDay = new MonitorLogByDayModel();
            let LogWeek = new MonitorLogByWeekModel();

            Log.monitorId = data.monitorId;
            Log.probeId = data.probeId;
            Log.responseTime = data.responseTime;
            Log.responseStatus = data.responseStatus;
            Log.data = data.data ? {
                cpuLoad: data.data.load.currentload,
                avgCpuLoad: data.data.load.avgload,
                cpuCores: data.data.load.cpus.length,
                memoryUsed: data.data.memory.used,
                totalMemory: data.data.memory.total,
                swapUsed: data.data.memory.swapused,
                storageUsed: data.data.disk.used,
                totalStorage: data.data.disk.size,
                storageUsage: data.data.disk.use,
                mainTemp: data.data.temperature.main,
                maxTemp: data.data.temperature.max
            } : null;
            Log.status = data.status;

            var savedLog = await Log.save();
            // intervalDate: moment(logData.createdAt).format(outputFormat)
            var logByHour = await LogHour.findOne({ intervalDate: '' });
            if (logByHour) {
                await LogHour.findOneAndUpdate({},
                    {
                        $set: {

                        }
                    },
                    {
                        new: true
                    });
            }
            var logByDay = await LogDay.findOne({ intervalDate: '' });
            if (logByDay) {
                await LogDay.findOneAndUpdate({},
                    {
                        $set: {

                        }
                    },
                    {
                        new: true
                    });
            }
            var logByWeek = await LogWeek.findOne({ intervalDate: '' });
            if (logByWeek) {
                await LogWeek.findOneAndUpdate({},
                    {
                        $set: {

                        }
                    },
                    {
                        new: true
                    });
            }

            await MonitorService.sendResponseTime(savedLog);
            await MonitorService.sendMonitorLog(savedLog);

            if (data.probeId && data.monitorId) await this.sendProbe(data.probeId, data.monitorId);

            return savedLog;
        } catch (error) {
            ErrorService.log('ProbeService.createMonitorLog', error);
            throw error;
        }
    },

    updateMonitorLogBy: async function (query, data) {
        try {
            if (!query) {
                query = {};
            }
            var Log = await MonitorLogModel.findOneAndUpdate(query,
                { $set: data },
                {
                    new: true
                });
            return Log;
        } catch (error) {
            ErrorService.log('ProbeService.updateMonitorLogBy', error);
            throw error;
        }
    },

    createMonitorStatus: async function (data) {
        try {
            let MonitorStatus = new MonitorStatusModel();
            MonitorStatus.monitorId = data.monitorId;
            MonitorStatus.probeId = data.probeId;
            MonitorStatus.responseTime = data.responseTime;
            MonitorStatus.status = data.status;
            if (data.startTime) {
                MonitorStatus.startTime = data.startTime;
            }
            if (data.endTime) {
                MonitorStatus.endTime = data.endTime;
            }
            if (data.createdAt) {
                MonitorStatus.createdAt = data.createdAt;
            }
            var savedMonitorStatus = await MonitorStatus.save();
            return savedMonitorStatus;
        } catch (error) {
            ErrorService.log('ProbeService.createMonitorStatus', error);
            throw error;
        }
    },

    updateMonitorStatus: async function (monitorStatusId) {
        try {
            var MonitorStatus = await MonitorStatusModel.findOneAndUpdate({ _id: monitorStatusId },
                { $set: { endTime: Date.now() } },
                {
                    new: true
                });
            return MonitorStatus;
        } catch (error) {
            ErrorService.log('ProbeService.updateMonitorStatus', error);
            throw error;
        }
    },

    sendProbe: async function (probeId, monitorId) {
        try {
            var probe = await this.findOneBy({ _id: probeId });
            if (probe) {
                delete probe._doc.deleted;
                await RealTimeService.updateProbe(probe, monitorId);
            }
        } catch (error) {
            ErrorService.log('ProbeService.sendProbe', error);
            throw error;
        }
    },

    setTime: async function (data) {
        try {
            var _this = this;
            var mon, autoAcknowledge, autoResolve, incidentIds;
            var statuses = await MonitorStatusModel.find({ monitorId: data.monitorId, probeId: data.probeId })
                .sort([['createdAt', -1]])
                .limit(1);
            var log = await _this.createMonitorLog(data);
            var lastStatus = statuses && statuses[0] && statuses[0].status ? statuses[0].status : null;
            var lastStatusId = statuses && statuses[0] && statuses[0]._id ? statuses[0]._id : null;
            if (!lastStatus) {
                await _this.createMonitorStatus(data);
                let tempMon = await _this.incidentCreateOrUpdate(data, lastStatus);
                mon = tempMon.mon;
                incidentIds = tempMon.incidentIds;
                autoAcknowledge = lastStatus && lastStatus === 'degraded' ? mon.criteria.degraded.autoAcknowledge : lastStatus === 'offline' ? mon.criteria.down.autoAcknowledge : false;
                autoResolve = lastStatus === 'degraded' ? mon.criteria.degraded.autoResolve : lastStatus === 'offline' ? mon.criteria.down.autoResolve : false;
                await _this.incidentResolveOrAcknowledge(data, lastStatus, autoAcknowledge, autoResolve);
            }
            else if (lastStatus && lastStatus !== data.status) {
                if (lastStatusId) {
                    await _this.updateMonitorStatus(lastStatusId);
                }
                await _this.createMonitorStatus(data);
                let tempMon = await _this.incidentCreateOrUpdate(data, lastStatus);
                mon = tempMon.mon;
                incidentIds = tempMon.incidentIds;
                autoAcknowledge = lastStatus && lastStatus === 'degraded' ? mon.criteria.degraded.autoAcknowledge : lastStatus === 'offline' ? mon.criteria.down.autoAcknowledge : false;
                autoResolve = lastStatus === 'degraded' ? mon.criteria.degraded.autoResolve : lastStatus === 'offline' ? mon.criteria.down.autoResolve : false;
                await _this.incidentResolveOrAcknowledge(data, lastStatus, autoAcknowledge, autoResolve);
            }
            if (incidentIds && incidentIds.length) {
                log = await _this.updateMonitorLogBy({ _id: log._id }, { incidentIds });
            }
            return log;
        } catch (error) {
            ErrorService.log('ProbeService.setTime', error);
            throw error;
        }
    },

    incidentCreateOrUpdate: async function (data) {
        try {
            var monitor = await MonitorService.findOneBy({ _id: data.monitorId });
            var incidents = await IncidentService.findBy({ monitorId: data.monitorId, incidentType: data.status, resolved: false });
            var incidentIds = [];

            if (data.status === 'online' && monitor && monitor.criteria && monitor.criteria.up && monitor.criteria.up.createAlert) {
                if (incidents && incidents.length) {
                    incidentIds = incidents.map(async (incident) => {
                        return await IncidentService.updateOneBy({
                            _id: incident._id
                        }, {
                            probes: incident.probes.concat({
                                probeId: data.probeId,
                                updatedAt: Date.now(),
                                status: true,
                                reportedStatus: data.status
                            })
                        });
                    });
                }
                else {
                    incidentIds = await [IncidentService.create({
                        projectId: monitor.projectId,
                        monitorId: data.monitorId,
                        createdById: null,
                        incidentType: 'online',
                        probeId: data.probeId
                    })];
                }
            }
            else if (data.status === 'degraded' && monitor && monitor.criteria && monitor.criteria.degraded && monitor.criteria.degraded.createAlert) {
                if (incidents && incidents.length) {
                    incidentIds = incidents.map(async (incident) => {
                        return await IncidentService.updateOneBy({
                            _id: incident._id
                        }, {
                            probes: incident.probes.concat({
                                probeId: data.probeId,
                                updatedAt: Date.now(),
                                status: true,
                                reportedStatus: data.status
                            })
                        });
                    });
                }
                else {
                    incidentIds = await [IncidentService.create({
                        projectId: monitor.projectId,
                        monitorId: data.monitorId,
                        createdById: null,
                        incidentType: 'degraded',
                        probeId: data.probeId
                    })];
                }
            }
            else if (data.status === 'offline' && monitor && monitor.criteria && monitor.criteria.down && monitor.criteria.down.createAlert) {
                if (incidents && incidents.length) {
                    incidentIds = incidents.map(async (incident) => {
                        return await IncidentService.updateOneBy({
                            _id: incident._id
                        }, {
                            probes: incident.probes.concat({
                                probeId: data.probeId,
                                updatedAt: Date.now(),
                                status: true,
                                reportedStatus: data.status
                            })
                        });
                    });
                }
                else {
                    incidentIds = await [IncidentService.create({
                        projectId: monitor.projectId,
                        monitorId: data.monitorId,
                        createdById: null,
                        incidentType: 'offline',
                        probeId: data.probeId
                    })];
                }
            }
            incidentIds = await Promise.all(incidentIds);
            incidentIds = incidentIds.map(i => i._id);
            return { mon: monitor, incidentIds };
        } catch (error) {
            ErrorService.log('ProbeService.incidentCreateOrUpdate', error);
            throw error;
        }
    },

    incidentResolveOrAcknowledge: async function (data, lastStatus, autoAcknowledge, autoResolve) {
        try {
            var incidents = await IncidentService.findBy({ monitorId: data.monitorId, incidentType: lastStatus, resolved: false });
            var incidentsV1 = [];
            var incidentsV2 = [];
            if (incidents && incidents.length) {
                if (lastStatus && lastStatus !== data.status) {
                    incidents.map(async (incident) => {
                        incident = incident.toObject();
                        incident.probes.some(probe => {
                            const probeId = data.probeId ? data.probeId.toString() : null;
                            if (probe.probeId === probeId) {
                                incidentsV1.push(incident);
                                return true;
                            }
                            else return false;
                        });
                    });
                }
            }
            await Promise.all(incidentsV1.map(async (v1) => {
                let newIncident = await IncidentService.updateOneBy({
                    _id: v1._id
                }, {
                    probes: v1.probes.concat([{
                        probeId: data.probeId,
                        updatedAt: Date.now(),
                        status: false,
                        reportedStatus: data.status
                    }])
                });
                incidentsV2.push(newIncident);
                return newIncident;
            }));

            incidentsV2.map(async (v2) => {
                let trueArray = [];
                let falseArray = [];
                v2.probes.map(probe => {
                    if (probe.status) {
                        trueArray.push(probe);
                    }
                    else {
                        falseArray.push(probe);
                    }
                });
                if (trueArray.length === falseArray.length) {
                    if (autoAcknowledge) {
                        if (!v2.acknowledged) {
                            await IncidentService.acknowledge(v2._id, null, 'fyipe');
                        }
                    }
                    if (autoResolve) {
                        await IncidentService.resolve(v2._id, null, 'fyipe');
                    }
                }
            });
            return {};
        } catch (error) {
            ErrorService.log('ProbeService.incidentResolveOrAcknowledge', error);
            throw error;
        }
    },

    getTime: async function (data) {
        try {
            var date = new Date();
            var log = await MonitorLogModel.findOne({ monitorId: data.monitorId, probeId: data.probeId, createdAt: { $lt: data.date || date } });
            return log;
        } catch (error) {
            ErrorService.log('probeService.getTime', error);
            throw error;
        }
    },

    getLogs: async function (query) {
        try {
            if (!query) {
                query = {};
            }
            var log = await MonitorStatusModel.find(query).sort({ createdAt: -1 });
            return log;
        } catch (error) {
            ErrorService.log('probeService.getLogs', error);
            throw error;
        }
    },

    getMonitorData: async function (monitorId) {
        try {
            var _this = this;
            var probes = await _this.findBy({});
            var targetDate = moment(Date.now()).subtract(90, 'days').startOf('day');
            var newProbes = Promise.all(probes.map(async (probe) => {
                probe = probe.toObject();
                var probeStatus = await _this.getLogs({
                    probeId: probe._id, monitorId: monitorId,
                    $or: [
                        { 'startTime': { $gt: targetDate } }, { $or: [{ 'endTime': { $gt: targetDate } }, { 'endTime': null }] }
                    ]
                });
                var latestLog = await MonitorLogModel
                    .find({ probeId: probe._id, monitorId: monitorId })
                    .sort({ createdAt: -1 })
                    .limit(1);
                probe.probeStatus = probeStatus;
                probe.status = latestLog && latestLog[0] && latestLog[0].status ? latestLog[0].status : '';
                probe.responseTime = latestLog && latestLog[0] && latestLog[0].responseTime ? latestLog[0].responseTime : '';
                return probe;
            }));
            return newProbes;
        } catch (error) {
            ErrorService.log('probeService.getMonitorData', error);
            throw error;
        }
    },

    updateProbeStatus: async function (probeId) {
        try {
            var probe = await ProbeModel.findOneAndUpdate({ _id: probeId }, { $set: { lastAlive: Date.now() } }, { new: true });
            return probe;
        } catch (error) {
            ErrorService.log('probeService.updateProbeStatus', error);
            throw error;
        }
    },

    conditions: async (payload, resp, con) => {
        let stat = true;
        let status = resp ? (resp.status ? resp.status : (resp.statusCode ? resp.statusCode : null)) : null;
        let body = resp && resp.body ? resp.body : null;

        if (con && con.and && con.and.length) {
            stat = await checkAnd(payload, con.and, status, body);
        }
        else if (con && con.or && con.or.length) {
            stat = await checkOr(payload, con.or, status, body);
        }
        return stat;
    },
};

var _ = require('lodash');

const checkAnd = async (payload, con, statusCode, body) => {
    let validity = true;
    for (let i = 0; i < con.length; i++) {
        if (con[i] && con[i].responseType && con[i].responseType === 'responseTime') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (!(con[i] && con[i].field1 && payload && payload > con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (!(con[i] && con[i].field1 && payload && payload < con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (!(con[i] && con[i].field1 && payload && con[i].field2 && payload > con[i].field1 && payload < con[i].field2)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (!(con[i] && con[i].field1 && payload && payload == con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (!(con[i] && con[i].field1 && payload && payload != con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (!(con[i] && con[i].field1 && payload && payload >= con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (!(con[i] && con[i].field1 && payload && payload <= con[i].field1)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'doesRespond') {
            if (con[i] && con[i].filter && con[i].filter === 'isUp') {
                if (!(con[i] && con[i].filter && payload)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'isDown') {
                if (!(con[i] && con[i].filter && !payload)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'statusCode') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (!(con[i] && con[i].field1 && statusCode && statusCode > con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (!(con[i] && con[i].field1 && statusCode && statusCode < con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (!(con[i] && con[i].field1 && statusCode && con[i].field2 && statusCode > con[i].field1 && statusCode < con[i].field2)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (!(con[i] && con[i].field1 && statusCode && statusCode == con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (!(con[i] && con[i].field1 && statusCode && statusCode != con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (!(con[i] && con[i].field1 && statusCode && statusCode >= con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (!(con[i] && con[i].field1 && statusCode && statusCode <= con[i].field1)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'cpuLoad') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload > con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload < con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && con[i].field2 && payload.load.currentload > con[i].field1 && payload.load.currentload < con[i].field2)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload == con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload != con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload >= con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (!(con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload <= con[i].field1)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'memoryUsage') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used > con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used < con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && con[i].field2 && payload.memory.used > con[i].field1 && payload.memory.used < con[i].field2)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used == con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used != con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used >= con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (!(con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used <= con[i].field1)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'storageUsage') {
            let size = payload.disk && payload.disk[0] && payload.disk[0].size ? parseInt(payload.disk[0].size) : 0;
            let used = payload.disk && payload.disk[0] && payload.disk[0].used ? parseInt(payload.disk[0].used) : 0;
            let free = (size - used) / Math.pow(1e3, 3);
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (!(con[i] && con[i].field1 && free > con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (!(con[i] && con[i].field1 && free < con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (!(con[i] && con[i].field1 && con[i].field2 && free > con[i].field1 && free < con[i].field2)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (!(con[i] && con[i].field1 && free === con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (!(con[i] && con[i].field1 && free !== con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (!(con[i] && con[i].field1 && free >= con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (!(con[i] && con[i].field1 && free <= con[i].field1)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'temperature') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main > con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main < con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && con[i].field2 && payload.temperature.main > con[i].field1 && payload.temperature.main < con[i].field2)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main == con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main != con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main >= con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (!(con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main <= con[i].field1)) {
                    validity = false;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'responseBody') {
            if (con[i] && con[i].filter && con[i].filter === 'contains') {
                if (!(con[i] && con[i].field1 && body && body[con[i].field1])) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'doesNotContain') {
                if (!(con[i] && con[i].field1 && body && !body[con[i].field1])) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'jsExpression') {
                if (!(con[i] && con[i].field1 && body && body[con[i].field1] === con[i].field1)) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'empty') {
                if (!(con[i] && con[i].filter && body && _.isEmpty(body))) {
                    validity = false;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEmpty') {
                if (!(con[i] && con[i].filter && body && !_.isEmpty(body))) {
                    validity = false;
                }
            }
        }
        if (con[i] && con[i].collection && con[i].collection.and && con[i].collection.and.length) {
            let temp = await checkAnd(payload, con[i].collection.and, statusCode, body);
            if (!temp) {
                validity = temp;
            }
        }
        else if (con[i] && con[i].collection && con[i].collection.or && con[i].collection.or.length) {
            let temp1 = await checkOr(payload, con[i].collection.or, statusCode, body);
            if (!temp1) {
                validity = temp1;
            }
        }
    }
    return validity;
};
const checkOr = async (payload, con, statusCode, body) => {
    let validity = false;
    for (let i = 0; i < con.length; i++) {
        if (con[i] && con[i].responseType === 'responseTime') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (con[i] && con[i].field1 && payload && payload > con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (con[i] && con[i].field1 && payload && payload < con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (con[i] && con[i].field1 && payload && con[i].field2 && payload > con[i].field1 && payload < con[i].field2) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (con[i] && con[i].field1 && payload && payload == con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (con[i] && con[i].field1 && payload && payload != con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (con[i] && con[i].field1 && payload && payload >= con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (con[i] && con[i].field1 && payload && payload <= con[i].field1) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'doesRespond') {
            if (con[i] && con[i].filter && con[i].filter === 'isUp') {
                if (con[i] && con[i].filter && payload) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'isDown') {
                if (con[i] && con[i].filter && !payload) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'statusCode') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (con[i] && con[i].field1 && statusCode && statusCode > con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (con[i] && con[i].field1 && statusCode && statusCode < con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (con[i] && con[i].field1 && statusCode && con[i].field2 && statusCode > con[i].field1 && statusCode < con[i].field2) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (con[i] && con[i].field1 && statusCode && statusCode == con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (con[i] && con[i].field1 && statusCode && statusCode != con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (con[i] && con[i].field1 && statusCode && statusCode >= con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (con[i] && con[i].field1 && statusCode && statusCode <= con[i].field1) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'cpuLoad') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload > con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload < con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && con[i].field2 && payload.load.currentload > con[i].field1 && payload.load.currentload < con[i].field2) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload == con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload != con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload >= con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (con[i] && con[i].field1 && payload.load && payload.load.currentload && payload.load.currentload <= con[i].field1) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'memoryUsage') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used > con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used < con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && con[i].field2 && payload.memory.used > con[i].field1 && payload.memory.used < con[i].field2) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used == con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used != con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used >= con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (con[i] && con[i].field1 && payload.memory && payload.memory.used && payload.memory.used <= con[i].field1) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'storageUsage') {
            let size = payload.disk && payload.disk[0] && payload.disk[0].size ? parseInt(payload.disk[0].size) : 0;
            let used = payload.disk && payload.disk[0] && payload.disk[0].used ? parseInt(payload.disk[0].used) : 0;
            let free = (size - used) / Math.pow(1e3, 3);
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (con[i] && con[i].field1 && free > con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (con[i] && con[i].field1 && free < con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (con[i] && con[i].field1 && con[i].field2 && free > con[i].field1 && free < con[i].field2) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (con[i] && con[i].field1 && free === con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (con[i] && con[i].field1 && free !== con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (con[i] && con[i].field1 && free >= con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (con[i] && con[i].field1 && free <= con[i].field1) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'temperature') {
            if (con[i] && con[i].filter && con[i].filter === 'greaterThan') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main > con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'lessThan') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main < con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'inBetween') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && con[i].field2 && payload.temperature.main > con[i].field1 && payload.temperature.main < con[i].field2) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'equalTo') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main == con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEqualTo') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main != con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'gtEqualTo') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main >= con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'ltEqualTo') {
                if (con[i] && con[i].field1 && payload.temperature && payload.temperature.main && payload.temperature.main <= con[i].field1) {
                    validity = true;
                }
            }
        }
        else if (con[i] && con[i].responseType === 'responseBody') {
            if (con[i] && con[i].filter && con[i].filter === 'contains') {
                if (con[i] && con[i].field1 && body && body[con[i].field1]) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'doesNotContain') {
                if (con[i] && con[i].field1 && body && !body[con[i].field1]) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'jsExpression') {
                if (con[i] && con[i].field1 && body && body[con[i].field1] === con[i].field1) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'empty') {
                if (con[i] && con[i].filter && body && _.isEmpty(body)) {
                    validity = true;
                }
            }
            else if (con[i] && con[i].filter && con[i].filter === 'notEmpty') {
                if (con[i] && con[i].filter && body && !_.isEmpty(body)) {
                    validity = true;
                }
            }
        }
        if (con[i] && con[i].collection && con[i].collection.and && con[i].collection.and.length) {
            let temp = await checkAnd(payload, con[i].collection.and, statusCode, body);
            if (temp) {
                validity = temp;
            }
        }
        else if (con[i] && con[i].collection && con[i].collection.or && con[i].collection.or.length) {
            let temp1 = await checkOr(payload, con[i].collection.or, statusCode, body);
            if (temp1) {
                validity = temp1;
            }
        }
    }
    return validity;
};

let ProbeModel = require('../models/probe');
let MonitorLogModel = require('../models/monitorLog');
let MonitorLogByHourModel = require('../models/monitorLogByHour');
let MonitorLogByDayModel = require('../models/monitorLogByDay');
let MonitorLogByWeekModel = require('../models/monitorLogByWeek');
let MonitorStatusModel = require('../models/monitorStatus');
var RealTimeService = require('./realTimeService');
let ErrorService = require('./errorService');
let uuidv1 = require('uuid/v1');
var moment = require('moment');
let MonitorService = require('./monitorService');
let IncidentService = require('./incidentService');
