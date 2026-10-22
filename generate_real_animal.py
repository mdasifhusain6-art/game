import bpy
import math
import os

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in bpy.data.collections:
        bpy.data.collections.remove(c)

def create_tiger_coat_material():
    mat = bpy.data.materials.new(name="Mat_TigerCoat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    # Procedural Tiger Stripes using Wave Texture + Noise Distortion
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Y'
    wave.inputs["Scale"].default_value = 3.8
    wave.inputs["Distortion"].default_value = 5.2
    wave.inputs["Detail"].default_value = 3.0

    # ColorRamp: Dark Black/Brown Stripes to Rich Golden-Orange Fur
    cramp = nodes.new("ShaderNodeValToRGB")
    cramp.color_ramp.elements[0].position = 0.38
    cramp.color_ramp.elements[0].color = (0.04, 0.02, 0.01, 1.0) # Black/Dark Brown Stripe
    cramp.color_ramp.elements[1].position = 0.52
    cramp.color_ramp.elements[1].color = (0.92, 0.46, 0.06, 1.0) # Golden Tiger Amber

    links.new(wave.outputs["Color"], cramp.inputs["Fac"])
    links.new(cramp.outputs["Color"], bsdf.inputs["Base Color"])

    # Fur Velvet properties (non-metallic, high roughness, subtle subsurface)
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.65
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = 0.0
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.15
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.35

    return mat

def create_pbr_mat(name, color, roughness=0.5, subsurf=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    b = mat.node_tree.nodes.get("Principled BSDF")
    if "Base Color" in b.inputs:
        b.inputs["Base Color"].default_value = color
    if "Roughness" in b.inputs:
        b.inputs["Roughness"].default_value = roughness
    if "Metallic" in b.inputs:
        b.inputs["Metallic"].default_value = 0.0
    if "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = subsurf
    return mat

def build_real_tiger(assets_dir):
    clean_scene()

    # Materials
    m_coat = create_tiger_coat_material()
    m_white_fur = create_pbr_mat("Mat_WhiteUnderfur", (0.95, 0.93, 0.90, 1.0), roughness=0.6, subsurf=0.1)
    m_nose = create_pbr_mat("Mat_PinkNose", (0.88, 0.42, 0.46, 1.0), roughness=0.35, subsurf=0.2)
    m_eye = create_pbr_mat("Mat_AmberEye", (0.95, 0.75, 0.12, 1.0), roughness=0.05)
    m_pupil = create_pbr_mat("Mat_BlackPupil", (0.01, 0.01, 0.01, 1.0), roughness=0.05)
    m_paws = create_pbr_mat("Mat_PawPads", (0.15, 0.12, 0.11, 1.0), roughness=0.45)

    # Master Root
    root = bpy.data.objects.new("Tiger_Root", None)
    bpy.context.scene.collection.objects.link(root)
    root.location = (0, 0, 0.5)

    # 1. Main Muscular Torso (Ribcage / Chest)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.62, location=(0, 0.25, 0.68))
    chest = bpy.context.active_object
    chest.name = "Tiger_Chest"
    chest.scale = (0.92, 1.45, 0.95)
    chest.parent = root
    chest.data.materials.append(m_coat)
    bpy.ops.object.shade_smooth()

    # White Chest Underfur
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.45, location=(0, 0.4, 0.45))
    chest_white = bpy.context.active_object
    chest_white.name = "Chest_Underfur"
    chest_white.scale = (0.75, 1.1, 0.7)
    chest_white.parent = chest
    chest_white.data.materials.append(m_white_fur)
    bpy.ops.object.shade_smooth()

    # Muscular Hips / Hindquarters
    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=18, radius=0.55, location=(0, -0.75, 0.65))
    hips = bpy.context.active_object
    hips.name = "Tiger_Hips"
    hips.scale = (0.85, 1.25, 0.9)
    hips.parent = root
    hips.data.materials.append(m_coat)
    bpy.ops.object.shade_smooth()

    # Tapered Waist Flank
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.5, location=(0, -0.25, 0.66))
    waist = bpy.context.active_object
    waist.name = "Tiger_Waist"
    waist.scale = (0.78, 1.0, 0.82)
    waist.parent = root
    waist.data.materials.append(m_coat)
    bpy.ops.object.shade_smooth()

    # 2. Organic Neck & Feline Head
    # Muscular Arched Neck
    bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.75, vertices=24, location=(0, 0.95, 0.95), rotation=(math.radians(40), 0, 0))
    neck = bpy.context.active_object
    neck.name = "Tiger_Neck"
    neck.scale = (0.85, 0.9, 1.0)
    neck.parent = root
    neck.data.materials.append(m_coat)
    bpy.ops.object.shade_smooth()

    # Cranium / Head
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.42, location=(0, 1.35, 1.25))
    head = bpy.context.active_object
    head.name = "Tiger_Head"
    head.scale = (1.05, 1.0, 0.9)
    head.parent = root
    head.data.materials.append(m_coat)
    bpy.ops.object.shade_smooth()

    # Snout / Muzzle
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.28, location=(0, 1.68, 1.15))
    snout = bpy.context.active_object
    snout.name = "Tiger_Snout"
    snout.scale = (0.88, 1.05, 0.75)
    snout.parent = head
    snout.data.materials.append(m_white_fur)
    bpy.ops.object.shade_smooth()

    # Fleshy Pink Nose Tip
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.1, location=(0, 1.95, 1.22))
    nose = bpy.context.active_object
    nose.name = "Tiger_Nose"
    nose.scale = (1.2, 0.7, 0.7)
    nose.parent = snout
    nose.data.materials.append(m_nose)
    bpy.ops.object.shade_smooth()

    # Feline Eyes (Amber Iris + Slit Pupil)
    for side, sign in [("Left", -1), ("Right", 1)]:
        # Eyeball
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.09, location=(sign * 0.22, 1.56, 1.32))
        eye = bpy.context.active_object
        eye.name = f"Eye_{side}"
        eye.parent = head
        eye.data.materials.append(m_eye)
        bpy.ops.object.shade_smooth()

        # Black Pupil
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.04, vertices=16, location=(sign * 0.22, 1.63, 1.32), rotation=(math.radians(90), 0, 0))
        pupil = bpy.context.active_object
        pupil.name = f"Pupil_{side}"
        pupil.scale = (0.6, 1.0, 1.5) # Feline vertical pupil
        pupil.parent = eye
        pupil.data.materials.append(m_pupil)
        bpy.ops.object.shade_smooth()

        # Rounded Feline Ears with Dark Rim
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.16, location=(sign * 0.34, 1.28, 1.58), rotation=(0, math.radians(sign * 25), 0))
        ear = bpy.context.active_object
        ear.name = f"Ear_{side}"
        ear.scale = (0.45, 0.85, 1.1)
        ear.parent = head
        ear.data.materials.append(m_coat)
        bpy.ops.object.shade_smooth()

        # Inner Ear Light Fur
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.11, location=(sign * 0.32, 1.32, 1.58))
        inner_ear = bpy.context.active_object
        inner_ear.scale = (0.35, 0.65, 0.9)
        inner_ear.parent = ear
        inner_ear.data.materials.append(m_white_fur)
        bpy.ops.object.shade_smooth()

    # 3. Organic Muscular Legs & Soft Paws
    leg_data = [
        ("Front_L", -0.52, 0.65, 0.45, 1),
        ("Front_R", 0.52, 0.65, 0.45, -1),
        ("Hind_L", -0.48, -0.75, 0.42, 1),
        ("Hind_R", 0.48, -0.75, 0.42, -1)
    ]

    for name, lx, ly, lz, side in leg_data:
        # Muscular Shoulder / Thigh
        is_front = "Front" in name
        radius_top = 0.22 if is_front else 0.28
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=radius_top, location=(lx, ly, lz + 0.15))
        shoulder = bpy.context.active_object
        shoulder.name = f"Shoulder_{name}"
        shoulder.scale = (0.85, 1.2, 1.25)
        shoulder.parent = root
        shoulder.data.materials.append(m_coat)
        bpy.ops.object.shade_smooth()

        # Leg Limb
        rot_angle = math.radians(12) if is_front else math.radians(-16)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.52, vertices=20, location=(lx, ly + (0.05 if is_front else -0.05), lz - 0.12), rotation=(rot_angle, 0, 0))
        limb = bpy.context.active_object
        limb.name = f"Limb_{name}"
        limb.parent = shoulder
        limb.data.materials.append(m_coat)
        bpy.ops.object.shade_smooth()

        # Soft Organic 4-Toed Tiger Paw
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.18, location=(lx, ly + 0.08, 0.08))
        paw = bpy.context.active_object
        paw.name = f"Paw_{name}"
        paw.scale = (1.1, 1.35, 0.65)
        paw.parent = limb
        paw.data.materials.append(m_white_fur)
        bpy.ops.object.shade_smooth()

        # Paw Pads underneath
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.09, location=(lx, ly + 0.08, 0.02))
        pad = bpy.context.active_object
        pad.scale = (0.9, 1.1, 0.3)
        pad.parent = paw
        pad.data.materials.append(m_paws)

    # 4. Long Elegant Tiger Tail (Curved with black tip)
    tail_parent = hips
    tail_segments = 7
    for i in range(tail_segments):
        t_frac = i / tail_segments
        tz = 0.65 + math.sin(t_frac * 2.4) * 0.4
        ty = -1.1 - i * 0.25
        radius = 0.075 - i * 0.007
        
        bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=0.28, vertices=16, location=(0, ty, tz), rotation=(math.radians(-32 + i * 8), 0, 0))
        seg = bpy.context.active_object
        seg.name = f"Tail_Seg_{i}"
        seg.parent = root
        # Tail tip is dark black ring
        seg.data.materials.append(m_coat if i < tail_segments - 1 else m_pupil)
        bpy.ops.object.shade_smooth()

    # Export realistic animal GLB
    glb_path = os.path.join(assets_dir, "real_animal_tiger.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f">>> Real Animal Royal Bengal Tiger successfully baked to: {glb_path}")

if __name__ == "__main__":
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    build_real_tiger(assets_dir)
