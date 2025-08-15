import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

jeepSqlite(window);

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;

  constructor(
  ) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initDB() {
    if (Capacitor.getPlatform() === 'web') {
      if (!document.querySelector('jeep-sqlite')) {
        const jeepEl = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepEl);
      }

      await customElements.whenDefined('jeep-sqlite');

      await this.sqlite.initWebStore();
    }

    this.db = await this.sqlite.createConnection(
      'test_ionic',
      false,
      'no-encryption',
      1,
      false
    );

    await this.db.open();

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        due_date TEXT,
        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) NOT NULL,
        user_id INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    return this.db;
  }

  async addTask(data: any) {
    if (!this.db) {
      return Promise.reject('DB no inicializada.');
    }

    let add_data = [
      data.title, 
      data.description, 
      data.due_date, 
      data.status, 
      data.user_id, 
      data.created_at
    ];

    try {
      const res = await this.db.run(`INSERT INTO tasks (title, description, due_date, status, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`, add_data);

      let changes = 0;
      if (res && 'changes' in res) {
        if (typeof res.changes === 'number') {
          changes = res.changes;
        } else if (res.changes && 'changes' in res.changes) {
          changes = Number(res.changes.changes) || 0;
        }
      }

      let lastId: number | undefined = undefined;
      if (res && 'changes' in res) {
        if (res.changes && 'lastId' in res.changes) {
          lastId = res.changes.lastId;
        }
      }

      return {
        success: changes > 0,
        message: 'Tarea agregada correctamente',
        id: lastId
      };
    } catch (err) {
      return {
        success: false,
        message: 'Error al agregar tarea',
        error: err
      };
    }
  }

  async updateTask(id: number, data: any) {
    if (!this.db) {
      return Promise.reject('DB no inicializada.');
    }

    let update_data = [
      data.title, 
      data.description, 
      data.due_date, 
      data.status, 
      data.user_id, 
      data.synced,
      data.updated_at
    ];

    try {
      const res = await this.db.run(`UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ?, user_id = ?, synced = ?, updated_at = ? WHERE id = ${id}`, update_data);

      let changes: number = 0;
      if (res && 'changes' in res) {
        if (typeof res.changes === 'number') {
          changes = res.changes;
        } else if (res.changes && 'changes' in res.changes) {
          changes = Number(res.changes.changes) || 0;
        }
      }

      return {
        success: changes > 0,
        message: 'Tarea editada correctamente'
      };
    } catch (err) {
      return {
        success: false,
        message: 'Error al editar la tarea',
        error: err
      };
    }
  }

  async updateStatusTask(id: number, data: any) {
    if (!this.db) {
      return Promise.reject('DB no inicializada.');
    }

    let update_data = [
      data.status
    ];

    try {
      const res = await this.db.run(`UPDATE tasks SET status = ? WHERE id = ${id}`, update_data);

      let changes: number = 0;
      if (res && 'changes' in res) {
        if (typeof res.changes === 'number') {
          changes = res.changes;
        } else if (res.changes && 'changes' in res.changes) {
          changes = Number(res.changes.changes) || 0;
        }
      }

      return {
        success: changes > 0,
        message: 'Tarea editada correctamente'
      };
    } catch (err) {
      return {
        success: false,
        message: 'Error al editar la tarea',
        error: err
      };
    }
  }

  async deleteTask(id: number) {
    if (!this.db) {
      return Promise.reject('DB no inicializada.');
    }

    return await this.db.run(`DELETE FROM tasks WHERE id = ?`, [id])
    .then(() => {
      return { success: true, message: 'Tarea eliminada correctamente' };
    })
    .catch(err => {
      return { success: false, message: 'Error al eliminar tarea', error: err };
    });
  }

  async deleteTasks() {
    if (!this.db) {
      return Promise.reject('DB no inicializada.');
    }

    return await this.db.run(`DELETE FROM tasks`, [])
    .then(() => {
      return { success: true, message: 'Tareas eliminadas correctamente' };
    })
    .catch(err => {
      return { success: false, message: 'Error al eliminar tareas', error: err };
    });
  }

  async getTasks() {
    if (!this.db) return [];

    const result = await this.db.query(`SELECT * FROM tasks WHERE synced = 0`);
    return result.values || [];
  }

  async getTask(id: number) {
    if (!this.db) return [];

    const res = await this.db.query(`SELECT * FROM tasks WHERE id = ?`, [id]);
    return res.values || [];
  }
}
