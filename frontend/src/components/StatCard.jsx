import React from "react";
import Card from "./Card";
import "./StatCard.css";

function StatCard({ title, value, icon: Icon, color = "primary" }) {
  return (
    <Card className="stat-card no-hover">
      <div className="stat-content">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
        </div>
        <div className={`stat-icon stat-icon-${color}`}>
          {Icon && <Icon size={32} />}
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
