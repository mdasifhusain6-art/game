import bpy
import math
import os

def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in bpy.data.collections:
        bpy.data.collections.remove(c)

def create_mat(name, color, rough=0.2, metal=0.0, emit_col=None, emit_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    b = mat.node_tree.nodes.get("Principled BSDF")
    if "Base Color" in b.inputs:
        b.inputs["Base Color"].default_value = color
    if "Roughness" in b.inputs:
        b.inputs["Roughness"].default_value = rough
    if "Metallic" in b.inputs:
        b.inputs["Metallic"].default_value = metal
    if emit_col:
        if "Emission Color" in b.inputs:
            b.inputs["Emission Color"].default_value = emit_col
        if "Emission Strength" in b.inputs:
            b.inputs["Emission Strength"].default_value = emit_strength
    return mat

def export_glb(filepath):
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"Exported: {filepath}")

def build_player(assets_dir):
    clean()
    m_body = create_mat("PlayerBody", (0.05, 0.08, 0.12, 1.0), rough=0.2, metal=0.8)
    m_cockpit = create_mat("Cockpit", (0.0, 0.9, 1.0, 1.0), rough=0.05, emit_col=(0.0, 0.9, 1.0, 1.0), emit_strength=4.0)
    m_accent = create_mat("Accent", (1.0, 0.2, 0.4, 1.0), rough=0.3, emit_col=(1.0, 0.2, 0.4, 1.0), emit_strength=3.0)
    m_thruster = create_mat("Thruster", (0.0, 1.0, 0.8, 1.0), rough=0.1, emit_col=(0.0, 1.0, 0.8, 1.0), emit_strength=10.0)

    # 1. Main Fuselage
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.2))
    fuselage = bpy.context.active_object
    fuselage.name = "Fuselage"
    fuselage.scale = (0.7, 1.6, 0.28)
    fuselage.data.materials.append(m_body)
    bpy.ops.object.shade_smooth()

    # 2. Nose Cone (Forward wedge)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.6, depth=1.2, location=(0, 1.4, 0.2), rotation=(math.radians(90), 0, math.radians(45)))
    nose = bpy.context.active_object
    nose.name = "Nose"
    nose.scale = (0.7, 0.28, 1.0)
    nose.data.materials.append(m_body)
    bpy.ops.object.shade_smooth()

    # 3. Cockpit Canopy
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.38, location=(0, 0.2, 0.38))
    cockpit = bpy.context.active_object
    cockpit.name = "Cockpit"
    cockpit.scale = (0.65, 1.3, 0.55)
    cockpit.data.materials.append(m_cockpit)
    bpy.ops.object.shade_smooth()

    # 4. Angled Wings
    # Left Wing
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.0, -0.2, 0.18), rotation=(0, math.radians(-10), math.radians(20)))
    wing_l = bpy.context.active_object
    wing_l.name = "Wing_Left"
    wing_l.scale = (1.1, 0.6, 0.08)
    wing_l.data.materials.append(m_body)

    # Left Wingtip Accent
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.5, -0.4, 0.36), rotation=(0, math.radians(-25), 0))
    wingtip_l = bpy.context.active_object
    wingtip_l.name = "Wingtip_Left"
    wingtip_l.scale = (0.1, 0.65, 0.35)
    wingtip_l.data.materials.append(m_accent)

    # Right Wing
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.0, -0.2, 0.18), rotation=(0, math.radians(10), math.radians(-20)))
    wing_r = bpy.context.active_object
    wing_r.name = "Wing_Right"
    wing_r.scale = (1.1, 0.6, 0.08)
    wing_r.data.materials.append(m_body)

    # Right Wingtip Accent
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.5, -0.4, 0.36), rotation=(0, math.radians(25), 0))
    wingtip_r = bpy.context.active_object
    wingtip_r.name = "Wingtip_Right"
    wingtip_r.scale = (0.1, 0.65, 0.35)
    wingtip_r.data.materials.append(m_accent)

    # 5. Dual Rear Thrusters
    for side, sign in [("Left", -1), ("Right", 1)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.5, vertices=16, location=(sign * 0.35, -0.9, 0.2), rotation=(math.radians(90), 0, 0))
        thr = bpy.context.active_object
        thr.name = f"Thruster_{side}"
        thr.data.materials.append(m_body)

        # Thruster exhaust ring (glowing)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.08, vertices=16, location=(sign * 0.35, -1.15, 0.2), rotation=(math.radians(90), 0, 0))
        glow = bpy.context.active_object
        glow.name = f"Thruster_Glow_{side}"
        glow.data.materials.append(m_thruster)

    export_glb(os.path.join(assets_dir, "player.glb"))

def build_crystal(assets_dir):
    clean()
    m_crystal = create_mat("CrystalMat", (0.0, 0.95, 1.0, 1.0), rough=0.05, emit_col=(0.1, 0.9, 1.0, 1.0), emit_strength=6.0)
    
    # Octahedral diamond shape
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.6, radius2=0.0, depth=0.8, location=(0, 0, 0.4))
    top = bpy.context.active_object
    top.data.materials.append(m_crystal)

    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.6, radius2=0.0, depth=0.8, location=(0, 0, -0.4), rotation=(math.radians(180), 0, 0))
    bot = bpy.context.active_object
    bot.data.materials.append(m_crystal)

    # Inner core
    m_core = create_mat("CoreMat", (1.0, 0.9, 0.2, 1.0), rough=0.1, emit_col=(1.0, 0.9, 0.2, 1.0), emit_strength=12.0)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.25, location=(0, 0, 0))
    core = bpy.context.active_object
    core.data.materials.append(m_core)

    export_glb(os.path.join(assets_dir, "crystal.glb"))

def build_obstacle(assets_dir):
    clean()
    m_pillar = create_mat("PillarMat", (0.08, 0.1, 0.15, 1.0), rough=0.3, metal=0.8)
    m_laser = create_mat("LaserMat", (1.0, 0.05, 0.2, 1.0), rough=0.05, emit_col=(1.0, 0.05, 0.2, 1.0), emit_strength=12.0)
    m_warn = create_mat("WarnMat", (1.0, 0.7, 0.0, 1.0), rough=0.2, emit_col=(1.0, 0.7, 0.0, 1.0), emit_strength=4.0)

    # Left & Right Barrier Columns
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 1.6, 0, 1.2))
        col = bpy.context.active_object
        col.scale = (0.45, 0.45, 2.4)
        col.data.materials.append(m_pillar)

        # Warning light on top
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, location=(sign * 1.6, 0, 2.5))
        light = bpy.context.active_object
        light.data.materials.append(m_warn)

    # Central Pulsing Laser Beam
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=3.2, vertices=16, location=(0, 0, 0.8), rotation=(0, math.radians(90), 0))
    beam = bpy.context.active_object
    beam.data.materials.append(m_laser)

    # Top Beam
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=3.2, vertices=16, location=(0, 0, 1.8), rotation=(0, math.radians(90), 0))
    beam_top = bpy.context.active_object
    beam_top.data.materials.append(m_laser)

    export_glb(os.path.join(assets_dir, "obstacle.glb"))

def build_powerups(assets_dir):
    # Shield Powerup
    clean()
    m_shield = create_mat("ShieldMat", (0.2, 0.6, 1.0, 1.0), rough=0.1, emit_col=(0.2, 0.6, 1.0, 1.0), emit_strength=8.0)
    m_gold = create_mat("GoldMat", (1.0, 0.8, 0.1, 1.0), rough=0.2, metal=0.9)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(0, 0, 0.6))
    sphere = bpy.context.active_object
    sphere.data.materials.append(m_shield)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.08, location=(0, 0, 0.6), rotation=(math.radians(35), 0, 0))
    ring = bpy.context.active_object
    ring.data.materials.append(m_gold)
    export_glb(os.path.join(assets_dir, "powerup_shield.glb"))

    # Magnet Powerup
    clean()
    m_mag = create_mat("MagMat", (1.0, 0.2, 0.2, 1.0), rough=0.2, emit_col=(1.0, 0.2, 0.2, 1.0), emit_strength=5.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.6, minor_radius=0.15, location=(0, 0, 0.6))
    mag = bpy.context.active_object
    mag.data.materials.append(m_mag)
    export_glb(os.path.join(assets_dir, "powerup_magnet.glb"))

def main():
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    os.makedirs(assets_dir, exist_ok=True)
    print(">>> Generating 3D Assets for Cosmo Runner 3D...")
    build_player(assets_dir)
    build_crystal(assets_dir)
    build_obstacle(assets_dir)
    build_powerups(assets_dir)
    print(">>> All 3D Assets Generated Successfully!")

if __name__ == "__main__":
    main()
