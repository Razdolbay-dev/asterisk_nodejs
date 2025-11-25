const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config/app');

class SnapshotService {
    constructor() {
        this.snapshotsPath = path.join(__dirname, '../../../', config.paths.snapshots);
        this.ensureSnapshotsDirectory();
    }

    // Создание директории снапшотов
    async ensureSnapshotsDirectory() {
        try {
            await fs.access(this.snapshotsPath);
        } catch (error) {
            await fs.mkdir(this.snapshotsPath, { recursive: true });
            console.log(`✅ Created snapshots directory: ${this.snapshotsPath}`);
        }
    }

    // Создание снапшота
    async createSnapshot(comment = '', createdBy = 'system') {
        const snapshotId = uuidv4();
        const snapshotPath = path.join(this.snapshotsPath, snapshotId);
        const generatedPath = path.join(__dirname, '../../../', config.paths.generated);

        try {
            // Создаем директорию для снапшота
            await fs.mkdir(snapshotPath, { recursive: true });

            // Копируем все файлы из generated
            const files = await fs.readdir(generatedPath);

            for (const file of files) {
                const sourcePath = path.join(generatedPath, file);
                const destPath = path.join(snapshotPath, file);

                const stats = await fs.stat(sourcePath);
                if (stats.isFile()) {
                    await fs.copyFile(sourcePath, destPath);
                }
            }

            // Сохраняем метаданные снапшота
            const metadata = {
                id: snapshotId,
                comment,
                createdBy,
                timestamp: new Date().toISOString(),
                files: files.filter(file => !file.endsWith('.tmp'))
            };

            await fs.writeFile(
                path.join(snapshotPath, 'metadata.json'),
                JSON.stringify(metadata, null, 2),
                'utf8'
            );

            console.log(`✅ Snapshot created: ${snapshotId}`);
            return metadata;

        } catch (error) {
            console.error('❌ Failed to create snapshot:', error);
            throw error;
        }
    }

    // Восстановление из снапшота
    async restoreSnapshot(snapshotId) {
        const snapshotPath = path.join(this.snapshotsPath, snapshotId);
        const generatedPath = path.join(__dirname, '../../../', config.paths.generated);

        try {
            // Проверяем существование снапшота
            await fs.access(snapshotPath);

            // Читаем метаданные
            const metadata = JSON.parse(
                await fs.readFile(path.join(snapshotPath, 'metadata.json'), 'utf8')
            );

            // Очищаем generated директорию
            const files = await fs.readdir(generatedPath);
            for (const file of files) {
                if (file.endsWith('.tmp')) continue;
                await fs.unlink(path.join(generatedPath, file));
            }

            // Копируем файлы из снапшота
            for (const file of metadata.files) {
                const sourcePath = path.join(snapshotPath, file);
                const destPath = path.join(generatedPath, file);
                await fs.copyFile(sourcePath, destPath);
            }

            console.log(`✅ Snapshot restored: ${snapshotId}`);
            return metadata;

        } catch (error) {
            console.error('❌ Failed to restore snapshot:', error);
            throw error;
        }
    }

    // Получение списка снапшотов
    async listSnapshots() {
        try {
            const items = await fs.readdir(this.snapshotsPath);
            const snapshots = [];

            for (const item of items) {
                const itemPath = path.join(this.snapshotsPath, item);
                const stats = await fs.stat(itemPath);

                if (stats.isDirectory()) {
                    try {
                        const metadataPath = path.join(itemPath, 'metadata.json');
                        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                        snapshots.push(metadata);
                    } catch (error) {
                        console.warn(`⚠️ Invalid snapshot: ${item}`);
                    }
                }
            }

            // Сортируем по дате создания (новые сначала)
            return snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('❌ Failed to list snapshots:', error);
            return [];
        }
    }

    // Удаление снапшота
    async deleteSnapshot(snapshotId) {
        const snapshotPath = path.join(this.snapshotsPath, snapshotId);

        try {
            await fs.access(snapshotPath);
            await fs.rm(snapshotPath, { recursive: true, force: true });
            console.log(`✅ Snapshot deleted: ${snapshotId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete snapshot:', error);
            throw error;
        }
    }
}

module.exports = new SnapshotService();