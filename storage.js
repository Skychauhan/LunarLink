// ============================================
// WIFI CODES - SUPABASE STORAGE MANAGER
// ============================================

const Storage = {

    async init() {
        if (!supabase) {
            console.error('Supabase not initialized!');
            return false;
        }
        try {
            const { data: stats } = await supabase
                .from('stats').select('*').eq('id', 1).single();
            if (!stats) {
                await supabase.from('stats').insert({
                    id: 1, total_codes_uploaded: 0, codes_used: 0,
                    yes_clicks: 0, no_clicks: 0, batches_uploaded: 0
                });
            }
            return true;
        } catch(e) {
            console.error('Storage init error:', e);
            return false;
        }
    },

    async getCodes() {
        try {
            const { data, error } = await supabase
                .from('codes').select('*').order('added_on', { ascending: false });
            if (error) throw error;
            return data.map(c => ({
                id: c.id, code: c.code, speed: c.speed,
                batch: c.batch, status: c.status,
                addedOn: c.added_on, usedOn: c.used_on
            }));
        } catch(e) { console.error('getCodes error:', e); return []; }
    },

    async getUnusedCodesBySpeed(speed) {
        try {
            const { data, error } = await supabase
                .from('codes').select('*')
                .eq('speed', speed).eq('status', 'unused');
            if (error) throw error;
            return data.map(c => ({
                id: c.id, code: c.code, speed: c.speed,
                batch: c.batch, status: c.status, addedOn: c.added_on
            }));
        } catch(e) { console.error('getUnusedCodesBySpeed error:', e); return []; }
    },

    async getRandomCode(speed) {
        try {
            const codes = await this.getUnusedCodesBySpeed(speed);
            if (!codes.length) return null;
            return codes[Math.floor(Math.random() * codes.length)];
        } catch(e) { return null; }
    },

    async addCodes(newCodes, batchName, speed) {
        try {
            const codesToAdd = newCodes.map(code => ({
                code: code.trim(), speed, batch: batchName, status: 'unused'
            }));
            const { data, error } = await supabase
                .from('codes').insert(codesToAdd).select();
            if (error) throw error;
            await this.addBatch(batchName, speed, newCodes.length);
            await this.incrementStats('total_codes_uploaded', newCodes.length);
            await this.incrementStats('batches_uploaded', 1);
            return data.length;
        } catch(e) { console.error('addCodes error:', e); throw e; }
    },

    async markCodeAsUsed(codeString, speed) {
        try {
            const { data: codes, error: findError } = await supabase
                .from('codes').select('*')
                .eq('code', codeString).eq('speed', speed).eq('status', 'unused').limit(1);
            if (findError) throw findError;
            if (!codes || !codes.length) return false;
            const c = codes[0];
            await supabase.from('history').insert({ code: c.code, speed: c.speed, batch: c.batch });
            await supabase.from('codes').delete().eq('id', c.id);
            await this.incrementStats('codes_used', 1);
            await this.incrementStats('yes_clicks', 1);
            return true;
        } catch(e) { console.error('markCodeAsUsed error:', e); return false; }
    },

    async removeCode(codeString, speed) {
        try {
            await supabase.from('codes').delete()
                .eq('code', codeString).eq('speed', speed);
            await this.incrementStats('no_clicks', 1);
            return true;
        } catch(e) { console.error('removeCode error:', e); return false; }
    },

    async getHistory() {
        try {
            const { data, error } = await supabase
                .from('history').select('*').order('used_on', { ascending: false });
            if (error) throw error;
            return data.map(h => ({
                id: h.id, code: h.code, speed: h.speed,
                batch: h.batch, usedOn: h.used_on
            }));
        } catch(e) { console.error('getHistory error:', e); return []; }
    },

    async getBatches() {
        try {
            const { data, error } = await supabase
                .from('batches').select('*').order('uploaded_on', { ascending: false });
            if (error) throw error;
            return data.map(b => ({
                id: b.id, batchName: b.batch_name, speed: b.speed,
                totalCodes: b.total_codes, uploadedOn: b.uploaded_on
            }));
        } catch(e) { console.error('getBatches error:', e); return []; }
    },

    async addBatch(batchName, speed, totalCodes) {
        try {
            await supabase.from('batches').insert({
                batch_name: batchName, speed, total_codes: totalCodes
            });
            return true;
        } catch(e) { console.error('addBatch error:', e); return false; }
    },

    async getStats() {
        try {
            const { data, error } = await supabase
                .from('stats').select('*').eq('id', 1).single();
            if (error) throw error;
            return {
                totalCodesUploaded: data.total_codes_uploaded || 0,
                codesUsed: data.codes_used || 0,
                yesClicks: data.yes_clicks || 0,
                noClicks: data.no_clicks || 0,
                batchesUploaded: data.batches_uploaded || 0,
                lastUpdated: data.last_updated
            };
        } catch(e) {
            return { totalCodesUploaded:0, codesUsed:0, yesClicks:0, noClicks:0, batchesUploaded:0 };
        }
    },

    async incrementStats(key, amount = 1) {
        try {
            const colMap = {
                total_codes_uploaded: 'total_codes_uploaded',
                codes_used: 'codes_used',
                yes_clicks: 'yes_clicks',
                no_clicks: 'no_clicks',
                batches_uploaded: 'batches_uploaded'
            };
            const col = colMap[key] || key;
            const { data } = await supabase.from('stats').select(col).eq('id', 1).single();
            const newVal = (data ? data[col] || 0 : 0) + amount;
            await supabase.from('stats').update({
                [col]: newVal, last_updated: new Date().toISOString()
            }).eq('id', 1);
            return true;
        } catch(e) { console.error('incrementStats error:', e); return false; }
    },

    async getLowCodeAlerts() {
        const alerts = [];
        try {
            for (const tier of AppConfig.speedTiers) {
                const { count, error } = await supabase
                    .from('codes').select('*', { count: 'exact', head: true })
                    .eq('speed', tier.value).eq('status', 'unused');
                if (error) continue;
                if (count <= AppConfig.alerts.criticalThreshold) {
                    alerts.push({ speed: tier.label, count, level: 'critical' });
                } else if (count <= AppConfig.alerts.lowCodeThreshold) {
                    alerts.push({ speed: tier.label, count, level: 'warning' });
                }
            }
        } catch(e) { console.error('getLowCodeAlerts error:', e); }
        return alerts;
    },

    async saveStats(stats) {
        try {
            await supabase.from('stats').update({
                total_codes_uploaded: stats.totalCodesUploaded || 0,
                codes_used: stats.codesUsed || 0,
                yes_clicks: stats.yesClicks || 0,
                no_clicks: stats.noClicks || 0,
                batches_uploaded: stats.batchesUploaded || 0,
                last_updated: new Date().toISOString()
            }).eq('id', 1);
            return true;
        } catch(e) { return false; }
    },

    async clearAll() {
        if (!confirm('⚠️ Delete ALL data? This cannot be undone!')) return false;
        if (!confirm('Final warning. All data will be lost forever. Continue?')) return false;
        try {
            await supabase.from('codes').delete().neq('id', 0);
            await supabase.from('history').delete().neq('id', 0);
            await supabase.from('batches').delete().neq('id', 0);
            await supabase.from('stats').update({
                total_codes_uploaded: 0, codes_used: 0,
                yes_clicks: 0, no_clicks: 0, batches_uploaded: 0,
                last_updated: new Date().toISOString()
            }).eq('id', 1);
            return true;
        } catch(e) { console.error('clearAll error:', e); return false; }
    }
};
